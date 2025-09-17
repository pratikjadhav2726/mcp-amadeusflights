declare module 'amadeus' {
  interface AmadeusConfig {
    clientId: string;
    clientSecret: string;
    hostname?: 'test' | 'production';
  }

  interface AmadeusResponse<T> {
    result: T;
  }

  interface FlightSearchParams {
    originLocationCode: string;
    destinationLocationCode: string;
    departureDate: string;
    returnDate?: string;
    adults: number;
    children?: number;
    infants?: number;
    travelClass?: string;
    nonStop?: boolean;
    maxPrice?: number;
    currencyCode?: string;
    max?: number;
  }

  interface AirportSearchParams {
    keyword: string;
    subType: string;
    countryCode?: string;
    max?: number;
  }

  interface AirlineSearchParams {
    airlineCodes?: string;
    max?: number;
  }

  class Amadeus {
    constructor(config: AmadeusConfig);
    
    shopping: {
      flightOffersSearch: {
        get(params: FlightSearchParams): Promise<AmadeusResponse<any>>;
        post(params: any): Promise<AmadeusResponse<any>>;
      };
      flightOffers: {
        pricing: {
          post(params: any): Promise<AmadeusResponse<any>>;
        };
      };
      flightDestinations: {
        get(params: any): Promise<AmadeusResponse<any>>;
      };
      flightDates: {
        get(params: any): Promise<AmadeusResponse<any>>;
      };
    };
    
    referenceData: {
      locations: {
        get(params: AirportSearchParams): Promise<AmadeusResponse<any>>;
      };
      airlines: {
        get(params: AirlineSearchParams): Promise<AmadeusResponse<any>>;
      };
    };
  }

  export = Amadeus;
}
