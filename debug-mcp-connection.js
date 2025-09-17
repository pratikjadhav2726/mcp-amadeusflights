const dotenv = require('dotenv');
const { AmadeusClient } = require('./dist/services/amadeus-client.js');

// Load environment variables
dotenv.config();

async function debugConnection() {
  try {
    console.log('🔍 Debugging MCP AmadeusClient connection...\n');
    
    const config = {
      amadeus: {
        clientId: process.env.AMADEUS_CLIENT_ID,
        clientSecret: process.env.AMADEUS_CLIENT_SECRET,
        environment: process.env.AMADEUS_ENVIRONMENT || 'test'
      },
      mcp: {
        name: 'test-server',
        version: '1.0.0',
        description: 'Test server'
      },
      logging: {
        level: 'info'
      },
      rateLimit: {
        requestsPerMinute: 60,
        burst: 10
      }
    };

    console.log('Config:', {
      clientId: config.amadeus.clientId ? 'SET' : 'NOT SET',
      clientSecret: config.amadeus.clientSecret ? 'SET' : 'NOT SET',
      environment: config.amadeus.environment
    });

    const client = new AmadeusClient(config);
    
    console.log('Testing direct API call...');
    try {
      const response = await client.amadeus.referenceData.locations.get({
        keyword: 'LON',
        subType: 'AIRPORT',
        max: 1
      });
      console.log('✅ Direct API call successful:', response.result ? 'YES' : 'NO');
    } catch (error) {
      console.log('❌ Direct API call failed:', error);
    }
    
    console.log('\nTesting testConnection method...');
    const isConnected = await client.testConnection();
    console.log('testConnection result:', isConnected);
    
  } catch (error) {
    console.error('❌ Error during setup:', error);
  }
}

debugConnection();
