const dotenv = require('dotenv');
const { AmadeusClient } = require('./dist/services/amadeus-client.js');

// Load environment variables
dotenv.config();

async function testFixedServer() {
  try {
    console.log('🧪 Testing Fixed Amadeus MCP Server...\n');
    
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

    const client = new AmadeusClient(config);
    
    console.log('1. Testing connection...');
    const isConnected = await client.testConnection();
    console.log('✅ Connection:', isConnected ? 'SUCCESS' : 'FAILED');
    
    if (isConnected) {
      console.log('\n2. Testing flight search...');
      try {
        const flightResults = await client.searchFlights({
          originLocationCode: 'LHR',
          destinationLocationCode: 'JFK',
          departureDate: '2024-12-01',
          adults: 1
        });
        console.log('✅ Flight search:', flightResults.data?.length || 0, 'results found');
      } catch (error) {
        console.log('❌ Flight search failed:', error.message);
      }
      
      console.log('\n3. Testing airport search...');
      try {
        const airportResults = await client.searchAirports({
          keyword: 'London',
          countryCode: 'GB'
        });
        console.log('✅ Airport search:', airportResults.data?.length || 0, 'airports found');
      } catch (error) {
        console.log('❌ Airport search failed:', error.message);
      }
    }
    
    console.log('\n🎉 Server test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFixedServer();
