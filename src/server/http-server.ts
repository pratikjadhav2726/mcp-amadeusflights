import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { AmadeusFlightsMCPServer } from './mcp-server.js';
import { ServerConfig } from '../types/mcp.js';

export class AmadeusFlightsHTTPServer {
  private app: express.Application;
  private config: ServerConfig;
  private transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};
  private servers: { [sessionId: string]: AmadeusFlightsMCPServer } = {};

  constructor(config: ServerConfig) {
    this.config = config;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // CORS configuration for browser-based clients and MCP clients (n8n, etc.)
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*', // Configure appropriately for production
      exposedHeaders: ['Mcp-Session-Id', 'mcp-session-id'], // Support both cases
      allowedHeaders: [
        'Content-Type', 
        'mcp-session-id', 
        'Mcp-Session-Id', 
        'Authorization',
        'X-Requested-With',
        'Accept'
      ], // Allow common headers that MCP clients might send
      credentials: true, // Allow credentials for authenticated requests
    }));

    // Middleware to normalize Accept header for MCP SDK compatibility
    // The MCP SDK requires Accept header to include both application/json and text/event-stream
    // Also detect n8n clients and ensure proper header handling
    this.app.use((req, res, next) => {
      const acceptHeader = req.headers.accept || req.headers['accept'];
      const userAgent = req.headers['user-agent'] || '';
      const isN8N = userAgent.includes('n8n') || req.headers['x-n8n'] || req.headers['n8n-version'];
      
      // If Accept header is missing, generic (*/*), or doesn't include required types, normalize it
      if (!acceptHeader || 
          acceptHeader === '*/*' || 
          (!acceptHeader.includes('application/json') || !acceptHeader.includes('text/event-stream'))) {
        // Set Accept header to include both required content types
        req.headers.accept = 'application/json, text/event-stream';
      }
      
      // Store n8n detection in request for later use
      (req as any).isN8N = isN8N;
      
      next();
    });

    // JSON parsing middleware with increased limit for large requests
    this.app.use(express.json({ limit: '10mb' }));

    // Request logging middleware with enhanced n8n detection
    this.app.use((req, res, next) => {
      const userAgent = req.headers['user-agent'] || '';
      const isN8N = userAgent.includes('n8n') || 
                   userAgent.includes('@n8n') ||
                   req.headers['x-n8n'] || 
                   req.headers['n8n-version'] ||
                   req.headers['x-requested-with']?.toString().toLowerCase().includes('n8n');
      
      console.error(`[HTTP] ${req.method} ${req.path} - Session: ${req.headers['mcp-session-id'] || 'new'} - Client: ${isN8N ? 'n8n' : userAgent.substring(0, 50) || 'unknown'}`);
      console.error(`[HTTP] Headers - Accept: ${req.headers.accept}, Content-Type: ${req.headers['content-type']}, User-Agent: ${userAgent.substring(0, 100)}`);
      
      // Store n8n detection in request for later use
      (req as any).isN8N = isN8N;
      
      next();
    });
  }

  private setupRoutes(): void {
    // Handle POST requests for client-to-server communication
    this.app.post('/mcp', async (req, res) => {
      try {
        await this.handleMCPRequest(req, res);
      } catch (error) {
        console.error('Error handling MCP request:', error);
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: null,
        });
      }
    });

    // Handle GET requests for server-to-client notifications via SSE
    this.app.get('/mcp', async (req, res) => {
      try {
        await this.handleSessionRequest(req, res);
      } catch (error) {
        console.error('Error handling GET request:', error);
        res.status(500).send('Internal server error');
      }
    });

    // Handle DELETE requests for session termination
    this.app.delete('/mcp', async (req, res) => {
      try {
        await this.handleSessionRequest(req, res);
      } catch (error) {
        console.error('Error handling DELETE request:', error);
        res.status(500).send('Internal server error');
      }
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        server: this.config.mcp.name,
        version: this.config.mcp.version,
        activeSessions: Object.keys(this.transports).length
      });
    });

    // Root endpoint with server information
    this.app.get('/', (req, res) => {
      res.json({
        name: this.config.mcp.name,
        version: this.config.mcp.version,
        description: this.config.mcp.description,
        endpoints: {
          mcp: '/mcp',
          health: '/health'
        },
        activeSessions: Object.keys(this.transports).length
      });
    });
  }

  private async handleMCPRequest(req: express.Request, res: express.Response): Promise<void> {
    // Check for existing session ID (case-insensitive header lookup)
    // Also check all possible header variations that n8n might send
    const sessionId = (req.headers['mcp-session-id'] || 
                      req.headers['Mcp-Session-Id'] || 
                      req.headers['mcp-sessionid'] ||
                      req.headers['MCP-Session-Id'] ||
                      req.headers['x-mcp-session-id']) as string | undefined;
    let transport: StreamableHTTPServerTransport;

    // Enhanced logging for debugging - log ALL headers to see what n8n sends
    const allHeaders = Object.keys(req.headers)
      .filter(key => key.toLowerCase().includes('session') || key.toLowerCase().includes('mcp'))
      .map(key => `${key}: ${req.headers[key]}`)
      .join(', ');
    console.error(`[HTTP] POST /mcp - Session: ${sessionId || 'new'}, Method: ${req.body?.method}, Headers with 'session' or 'mcp': [${allHeaders || 'none'}]`);
    console.error(`[HTTP] POST /mcp - Body: ${JSON.stringify(req.body).substring(0, 200)}`);

    if (sessionId && this.transports[sessionId]) {
      // Reuse existing transport
      transport = this.transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // New initialization request
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sessionId) => {
          // Store the transport by session ID
          this.transports[sessionId] = transport;
          console.error(`[HTTP] New session initialized: ${sessionId}`);
        },
        // DNS rebinding protection is disabled by default for backwards compatibility
        // For production, consider enabling:
        // enableDnsRebindingProtection: true,
        // allowedHosts: ['127.0.0.1', 'localhost'],
      });

      // Clean up transport when closed
      transport.onclose = () => {
        if (transport.sessionId) {
          delete this.transports[transport.sessionId];
          delete this.servers[transport.sessionId];
          console.error(`[HTTP] Session closed: ${transport.sessionId}`);
        }
      };

      // Create a new MCP server instance for this session
      const mcpServer = new AmadeusFlightsMCPServer(this.config);
      
      // Connect to the MCP server
      await mcpServer.connect(transport);
      
      // Store the server instance after connection
      this.servers[transport.sessionId!] = mcpServer;
    } else {
      // Invalid request - log details for debugging
      console.error(`[HTTP] Invalid request - Session: ${sessionId || 'none'}, Body keys: ${req.body ? Object.keys(req.body).join(',') : 'no body'}, isInitialize: ${isInitializeRequest(req.body)}`);
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: sessionId 
            ? 'Bad Request: Invalid session ID' 
            : 'Bad Request: No valid session ID provided and request is not a valid initialize request',
        },
        id: req.body?.id || null,
      });
      return;
    }

    // Handle the request using StreamableHTTPServerTransport
    // The transport's handleRequest method will:
    // 1. Set the Mcp-Session-Id header in the response automatically
    // 2. Handle the SSE (Server-Sent Events) stream for StreamableHTTP
    // 3. Manage session state internally
    
    // Log when response starts and finishes to verify session ID is set
    res.on('finish', () => {
      const responseSessionId = res.getHeader('Mcp-Session-Id') || res.getHeader('mcp-session-id');
      const currentSessionId = sessionId || transport.sessionId;
      console.error(`[HTTP] Response finished - Status: ${res.statusCode}, Session ID in header: ${responseSessionId || 'none'}, Transport session: ${currentSessionId || 'none'}`);
      
      // Verify the transport set the session ID correctly
      if (!responseSessionId && currentSessionId) {
        console.error(`[HTTP] WARNING: Session ID not set in response header but transport has session: ${currentSessionId}`);
      }
    });
    
    try {
      // CRITICAL: Disable Express response buffering for SSE/StreamableHTTP
      // This ensures responses are sent immediately, not buffered
      res.setHeader('X-Accel-Buffering', 'no');
      
      // Let StreamableHTTPServerTransport handle the request
      // It will automatically set the Mcp-Session-Id header in the response
      await transport.handleRequest(req, res, req.body);
      
      const currentSessionId = sessionId || transport.sessionId;
      console.error(`[HTTP] handleRequest completed for session: ${currentSessionId || 'new'}`);
    } catch (error) {
      console.error(`[HTTP] Error in handleRequest:`, error);
      throw error;
    }
  }

  private async handleSessionRequest(req: express.Request, res: express.Response): Promise<void> {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    
    if (!sessionId || !this.transports[sessionId]) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }
    
    const transport = this.transports[sessionId];
    await transport.handleRequest(req, res);
  }

  public async start(port: number = 3000): Promise<void> {
    return new Promise((resolve, reject) => {
      const server = this.app.listen(port, () => {
        console.error(`[HTTP] Amadeus Flights MCP Server started on port ${port}`);
        console.error(`[HTTP] Health check: http://localhost:${port}/health`);
        console.error(`[HTTP] MCP endpoint: http://localhost:${port}/mcp`);
        resolve();
      });

      // CRITICAL: Set extended timeouts for long-running MCP operations
      // MCP operations (like flight searches) can take time, especially with Amadeus API calls
      server.timeout = 3600000; // 1 hour in milliseconds
      server.keepAliveTimeout = 3600000; // 1 hour
      server.headersTimeout = 3600000; // 1 hour

      server.on('error', (error) => {
        console.error('Failed to start HTTP server:', error);
        reject(error);
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        console.error('Received SIGINT, shutting down gracefully...');
        server.close(() => {
          console.error('HTTP server closed');
          process.exit(0);
        });
      });

      process.on('SIGTERM', async () => {
        console.error('Received SIGTERM, shutting down gracefully...');
        server.close(() => {
          console.error('HTTP server closed');
          process.exit(0);
        });
      });
    });
  }

  public async stop(): Promise<void> {
    // Close all active sessions
    for (const [sessionId, transport] of Object.entries(this.transports)) {
      try {
        await transport.close();
        console.error(`[HTTP] Closed session: ${sessionId}`);
      } catch (error) {
        console.error(`[HTTP] Error closing session ${sessionId}:`, error);
      }
    }
    
    this.transports = {};
    this.servers = {};
    console.error('[HTTP] All sessions closed');
  }
}
