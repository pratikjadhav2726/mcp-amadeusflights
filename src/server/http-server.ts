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
    // CORS configuration for browser-based clients
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*', // Configure appropriately for production
      exposedHeaders: ['Mcp-Session-Id'],
      allowedHeaders: ['Content-Type', 'mcp-session-id'],
    }));

    // JSON parsing middleware
    this.app.use(express.json());

    // Request logging middleware
    this.app.use((req, res, next) => {
      console.error(`[HTTP] ${req.method} ${req.path} - Session: ${req.headers['mcp-session-id'] || 'new'}`);
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
    // Check for existing session ID
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;

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
      // Invalid request
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        },
        id: null,
      });
      return;
    }

    // Handle the request
    await transport.handleRequest(req, res, req.body);
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
