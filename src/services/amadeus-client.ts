// @ts-ignore
import Amadeus from 'amadeus';
import { 
  FlightSearchParams, 
  AirportSearchParams, 
  AirlineSearchParams,
  AmadeusResponse,
  FlightOffer,
  Airport,
  Airline
} from '../types/amadeus.js';
import { ServerConfig } from '../types/mcp.js';

export class AmadeusClient {
  private amadeus: Amadeus;
  private config: ServerConfig;

  constructor(config: ServerConfig) {
    this.config = config;
    this.amadeus = new Amadeus({
      clientId: config.amadeus.clientId,
      clientSecret: config.amadeus.clientSecret,
      hostname: config.amadeus.environment === 'production' ? 'production' : 'test'
    });
  }

  /**
   * Search for flight offers
   */
  async searchFlights(params: FlightSearchParams): Promise<AmadeusResponse<FlightOffer>> {
    try {
      const response = await this.amadeus.shopping.flightOffersSearch.get({
        originLocationCode: params.originLocationCode,
        destinationLocationCode: params.destinationLocationCode,
        departureDate: params.departureDate,
        returnDate: params.returnDate,
        adults: params.adults,
        children: params.children,
        infants: params.infants,
        travelClass: params.travelClass,
        nonStop: params.nonStop,
        maxPrice: params.maxPrice,
        currencyCode: params.currencyCode,
        max: params.max
      });

      return response.result;
    } catch (error: any) {
      throw this.handleAmadeusError(error);
    }
  }

  /**
   * Get specific flight offers by ID
   * Note: This method searches for flights with the offer ID as a filter
   */
  async getFlightOffers(offerId: string): Promise<AmadeusResponse<FlightOffer>> {
    try {
      // Since there's no direct "get by ID" method, we'll search for flights
      // and filter by the offer ID in the response
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const dateString = futureDate.toISOString().split('T')[0];
      
      const response = await this.amadeus.shopping.flightOffersSearch.get({
        // Use a broad search to find the specific offer
        originLocationCode: 'LHR', // Default origin
        destinationLocationCode: 'JFK', // Default destination  
        departureDate: dateString, // Future date
        adults: 1
      });

      // Filter results by offer ID
      const filteredData = response.result.data?.filter((offer: any) => offer.id === offerId) || [];
      
      return {
        ...response.result,
        data: filteredData
      };
    } catch (error: any) {
      throw this.handleAmadeusError(error);
    }
  }

  /**
   * Search for airports
   */
  async searchAirports(params: AirportSearchParams): Promise<AmadeusResponse<Airport>> {
    try {
      const requestParams: any = {
        keyword: params.keyword,
        subType: 'AIRPORT'
      };
      
      if (params.countryCode) {
        requestParams.countryCode = params.countryCode;
      }
      
      // Note: Amadeus API doesn't support 'max' parameter for airport search
      // We'll limit results after receiving them
      const response = await this.amadeus.referenceData.locations.get(requestParams);
      
      // Limit results if max is specified
      let result = response.result;
      if (params.max && result.data && result.data.length > params.max) {
        result = {
          ...result,
          data: result.data.slice(0, params.max),
          meta: {
            ...result.meta,
            count: Math.min(result.meta.count, params.max)
          }
        };
      }

      return result;
    } catch (error: any) {
      throw this.handleAmadeusError(error);
    }
  }

  /**
   * Get airline information
   */
  async getAirlines(params: AirlineSearchParams): Promise<AmadeusResponse<Airline>> {
    try {
      const requestParams: any = {};
      
      if (params.airlineCodes) {
        requestParams.airlineCodes = params.airlineCodes;
      }
      
      // Note: Amadeus airlines API doesn't support 'max' parameter
      // We'll limit results after receiving them
      const response = await this.amadeus.referenceData.airlines.get(requestParams);
      
      // Limit results if max is specified
      let result = response.result;
      if (params.max && result.data && result.data.length > params.max) {
        result = {
          ...result,
          data: result.data.slice(0, params.max),
          meta: {
            ...result.meta,
            count: Math.min(result.meta.count, params.max)
          }
        };
      }

      return result;
    } catch (error: any) {
      throw this.handleAmadeusError(error);
    }
  }

  /**
   * Search for multi-city flights
   */
  async searchMultiCityFlights(params: any): Promise<AmadeusResponse<FlightOffer>> {
    try {
      const response = await this.amadeus.shopping.flightOffersSearch.post({
        originDestinations: params.originDestinations,
        travelers: params.travelers,
        sources: params.sources,
        searchCriteria: params.searchCriteria
      });

      return response.result;
    } catch (error: any) {
      throw this.handleAmadeusError(error);
    }
  }


  /**
   * Search for cheapest flight dates
   */
  async searchFlightCheapestDates(params: any): Promise<AmadeusResponse<any>> {
    try {
      const response = await this.amadeus.shopping.flightDates.get({
        origin: params.origin,
        destination: params.destination,
        departureDate: params.departureDate,
        returnDate: params.returnDate,
        oneWay: params.oneWay,
        nonStop: params.nonStop,
        duration: params.duration,
        viewBy: params.viewBy,
        maxPrice: params.maxPrice,
        aggregationMode: params.aggregationMode
      });

      return response.result;
    } catch (error: any) {
      throw this.handleAmadeusError(error);
    }
  }

  /**
   * Handle Amadeus API errors
   */
  private handleAmadeusError(error: any): Error {
    console.error('Amadeus Error Details:', {
      error: error,
      response: error.response,
      request: error.request,
      message: error.message,
      code: error.code
    });

    if (error.response) {
      // API responded with error status
      const statusCode = error.response.status;
      const errorData = error.response.data || error.response.result;
      
      // Safely access error properties with better fallbacks
      let errorMessage = 'Unknown API error';
      
      if (errorData) {
        // Handle specific error cases
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const firstError = errorData.errors[0];
          errorMessage = firstError.detail || firstError.title || firstError.message || 'API Error';
        } else {
          errorMessage = errorData.error_description || 
                       errorData.detail || 
                       errorData.message || 
                       errorData.error || 
                       JSON.stringify(errorData);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return new Error(`Amadeus API Error (${statusCode}): ${errorMessage}`);
    } else if (error.request) {
      // Network error
      return new Error(`Network Error: Unable to connect to Amadeus API - ${error.message || 'Connection failed'}`);
    } else if (error.code) {
      // Amadeus SDK specific error
      return new Error(`Amadeus SDK Error (${error.code}): ${error.message || 'Unknown SDK error'}`);
    } else {
      // Other error
      return new Error(`Amadeus Client Error: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.amadeus.referenceData.locations.get({
        keyword: 'LON',
        subType: 'AIRPORT'
      });
      return response && response.result;
    } catch (error: any) {
      console.error('Connection test failed:', error.message || error.code || 'Unknown error');
      return false;
    }
  }
}
