const dotenv = require('dotenv');
const Amadeus = require('amadeus');

// Load environment variables
dotenv.config();

async function debugFlightSearch() {
  try {
    console.log('🔍 Debugging Flight Search...\n');
    
    const amadeus = new Amadeus({
      clientId: process.env.AMADEUS_CLIENT_ID,
      clientSecret: process.env.AMADEUS_CLIENT_SECRET,
      hostname: 'test'
    });
    
    console.log('Testing direct flight search...');
    // Use a future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const dateString = futureDate.toISOString().split('T')[0];
    
    console.log('Using date:', dateString);
    
    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: 'LHR',
      destinationLocationCode: 'JFK',
      departureDate: dateString,
      adults: 1
    });
    
    console.log('✅ Flight search successful!');
    console.log('Response structure:', Object.keys(response));
    console.log('Data length:', response.result?.data?.length || 0);
    
    if (response.result?.data?.length > 0) {
      console.log('First flight offer:', {
        id: response.result.data[0].id,
        price: response.result.data[0].price?.total,
        currency: response.result.data[0].price?.currency
      });
    }
    
  } catch (error) {
    console.log('❌ Flight search error:');
    console.log('Error type:', error.constructor.name);
    console.log('Error message:', error.message);
    console.log('Error code:', error.code);
    
    if (error.response) {
      console.log('HTTP Status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    
    if (error.description) {
      console.log('Error description:', error.description);
    }
  }
}

debugFlightSearch();
