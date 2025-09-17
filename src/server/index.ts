#!/usr/bin/env node

import dotenv from 'dotenv';
import { AmadeusFlightsMCPServer } from './mcp-server.js';
import { ServerConfig } from '../types/mcp.js';

// Load environment variables (suppress all output for MCP compliance)
const originalStdout = process.stdout.write;
const originalStderr = process.stderr.write;

// Temporarily suppress all output during dotenv loading
process.stdout.write = () => true;
process.stderr.write = () => true;

dotenv.config({ debug: false });

// Restore output functions
process.stdout.write = originalStdout;
process.stderr.write = originalStderr;

// Load configuration from environment variables
function loadConfig(): ServerConfig {
  const requiredEnvVars = ['AMADEUS_CLIENT_ID', 'AMADEUS_CLIENT_SECRET'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars.join(', '));
    console.error('Please check your .env file or set these variables in your environment.');
    process.exit(1);
  }

  return {
    amadeus: {
      clientId: process.env.AMADEUS_CLIENT_ID!,
      clientSecret: process.env.AMADEUS_CLIENT_SECRET!,
      environment: (process.env.AMADEUS_ENVIRONMENT as 'test' | 'production') || 'test'
    },
    mcp: {
      name: process.env.MCP_SERVER_NAME || 'amadeus-flights-server',
      version: process.env.MCP_SERVER_VERSION || '1.0.0',
      description: process.env.MCP_SERVER_DESCRIPTION || 'MCP server for Amadeus flight search capabilities'
    },
    logging: {
      level: (process.env.LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug') || 'info'
    },
    rateLimit: {
      requestsPerMinute: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '60'),
      burst: parseInt(process.env.RATE_LIMIT_BURST || '10')
    }
  };
}

// Main function
async function main(): Promise<void> {
  try {
    const config = loadConfig();
    const server = new AmadeusFlightsMCPServer(config);
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.error('Received SIGINT, shutting down gracefully...');
      await server.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.error('Received SIGTERM, shutting down gracefully...');
      await server.stop();
      process.exit(0);
    });

    // Start the server
    await server.start();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
main().catch((error) => {
  console.error('Unhandled error in main:', error);
  process.exit(1);
});
