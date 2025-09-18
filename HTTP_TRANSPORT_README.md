# HTTP Transport for MCP Amadeus Flights Server

This document explains how to use the HTTP transport for the MCP Amadeus Flights Server.

## Overview

The HTTP transport allows the MCP server to be accessed via HTTP requests, making it suitable for:
- Remote server deployments
- Browser-based MCP clients
- Integration with web applications
- Session-based stateful operations

## Features

- **Session Management**: Each client connection gets a unique session ID for stateful operations
- **CORS Support**: Configured for browser-based clients
- **Health Monitoring**: Built-in health check endpoint
- **Graceful Shutdown**: Proper cleanup of sessions and resources
- **Error Handling**: Comprehensive error handling and logging

## Environment Variables

Create a `.env` file with the following variables:

```bash
# Amadeus API Configuration
AMADEUS_CLIENT_ID=your_amadeus_client_id
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret
AMADEUS_ENVIRONMENT=test

# MCP Server Configuration
MCP_SERVER_NAME=amadeus-flights-server
MCP_SERVER_VERSION=1.1.0
MCP_SERVER_DESCRIPTION=MCP server for Amadeus flight search capabilities

# HTTP Server Configuration
HTTP_PORT=3000
CORS_ORIGIN=*

# Logging Configuration
LOG_LEVEL=info

# Rate Limiting Configuration
RATE_LIMIT_REQUESTS_PER_MINUTE=60
RATE_LIMIT_BURST=10
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

## Running the HTTP Server

### Development Mode
```bash
npm run dev:http
```

### Production Mode
```bash
npm run start:http
```

The server will start on the port specified in `HTTP_PORT` (default: 3000).

## API Endpoints

### MCP Endpoint
- **URL**: `http://localhost:3000/mcp`
- **Methods**: `POST`, `GET`, `DELETE`
- **Purpose**: Main MCP communication endpoint

### Health Check
- **URL**: `http://localhost:3000/health`
- **Method**: `GET`
- **Purpose**: Server health and status information

### Server Info
- **URL**: `http://localhost:3000/`
- **Method**: `GET`
- **Purpose**: Server information and active session count

## Usage with MCP Clients

### Session Management

1. **Initialize Session**: Send a POST request to `/mcp` with an initialize request
2. **Session ID**: The server responds with a `Mcp-Session-Id` header
3. **Subsequent Requests**: Include the session ID in the `mcp-session-id` header
4. **Session Cleanup**: Sessions are automatically cleaned up when closed

### Example Client Usage

```javascript
// Initialize session
const initResponse = await fetch('http://localhost:3000/mcp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'example-client',
        version: '1.0.0'
      }
    }
  })
});

const sessionId = initResponse.headers.get('Mcp-Session-Id');

// Use session for subsequent requests
const toolResponse = await fetch('http://localhost:3000/mcp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'mcp-session-id': sessionId
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'search_flights',
      arguments: {
        origin: 'LAX',
        destination: 'SEA',
        departureDate: '2024-12-01',
        adults: 1
      }
    }
  })
});
```

## CORS Configuration

The server is configured with CORS support for browser-based clients:

```javascript
cors({
  origin: process.env.CORS_ORIGIN || '*',
  exposedHeaders: ['Mcp-Session-Id'],
  allowedHeaders: ['Content-Type', 'mcp-session-id'],
})
```

For production, set `CORS_ORIGIN` to specific domains:
```bash
CORS_ORIGIN=https://your-domain.com,https://another-domain.com
```

## Security Considerations

1. **DNS Rebinding Protection**: Consider enabling for production:
   ```javascript
   enableDnsRebindingProtection: true,
   allowedHosts: ['127.0.0.1', 'localhost', 'your-domain.com'],
   ```

2. **CORS Configuration**: Restrict origins in production
3. **Rate Limiting**: Configure appropriate rate limits
4. **Environment Variables**: Keep API keys secure

## Monitoring

- **Health Check**: Monitor `/health` endpoint
- **Logs**: Server logs include session management and request details
- **Session Count**: Available in health check response

## Troubleshooting

### Common Issues

1. **"Bad Request: No valid session ID provided"**
   - Ensure CORS is properly configured
   - Check that `Mcp-Session-Id` header is exposed

2. **Session not found**
   - Sessions expire when transport closes
   - Re-initialize session if needed

3. **CORS errors in browser**
   - Verify `CORS_ORIGIN` configuration
   - Check that required headers are exposed

### Debug Mode

Set `LOG_LEVEL=debug` for detailed logging:
```bash
LOG_LEVEL=debug npm run dev:http
```

## Comparison with Stdio Transport

| Feature | Stdio Transport | HTTP Transport |
|---------|----------------|----------------|
| **Use Case** | Local CLI tools | Remote servers, web apps |
| **Session Management** | Single session | Multiple sessions |
| **Client Types** | CLI, desktop apps | Web browsers, remote clients |
| **Deployment** | Local process | Network service |
| **State** | Stateless | Stateful with sessions |
