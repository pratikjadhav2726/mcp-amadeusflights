// MCP-specific types
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
}

export interface MCPToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

// Tool Parameter Types
export interface SearchFlightsParams {
  origin: string;
  destination: string;
  departureDate: string;
  adults: number;
  children?: number;
  infants?: number;
  returnDate?: string;
  travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  nonStop?: boolean;
  maxPrice?: number;
  currencyCode?: string;
  max?: number;
}

export interface GetFlightOffersParams {
  offerId: string;
}

export interface SearchAirportsParams {
  keyword: string;
  countryCode?: string;
  max?: number;
}

export interface GetAirlineCodesParams {
  airlineCodes?: string;
  max?: number;
}

export interface SearchMultiCityFlightsParams {
  originDestinations: Array<{
    id: string;
    originLocationCode: string;
    destinationLocationCode: string;
    departureDateTimeRange: {
      date: string;
      time?: string;
    };
  }>;
  travelers: Array<{
    id: string;
    travelerType: 'ADULT' | 'CHILD' | 'SENIOR' | 'YOUNG' | 'HELD_INFANT' | 'SEATED_INFANT' | 'STUDENT';
  }>;
  sources: string[];
  searchCriteria?: {
    maxFlightOffers?: number;
    flightFilters?: {
      cabinRestrictions?: Array<{
        cabin: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
        coverage: 'MOST_SEGMENTS' | 'AT_LEAST_ONE_SEGMENT' | 'ALL_SEGMENTS';
        originDestinationIds: string[];
      }>;
    };
  };
}

export interface GetFlightInspirationParams {
  origin: string;
  destination?: string;
  departureDate?: string;
  duration?: string;
  oneWay?: boolean;
  nonStop?: boolean;
  viewBy?: 'DURATION' | 'DATE' | 'DESTINATION';
  maxPrice?: number;
  aggregationMode?: 'DAY' | 'DESTINATION' | 'WEEK';
}

export interface SearchFlightCheapestDatesParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  oneWay?: boolean;
  nonStop?: boolean;
  duration?: string;
  viewBy?: 'DURATION' | 'DATE' | 'DESTINATION';
  maxPrice?: number;
  aggregationMode?: 'DAY' | 'DESTINATION' | 'WEEK';
}

// Error Types
export interface MCPError {
  code: string;
  message: string;
  details?: any;
}

export interface ValidationError extends MCPError {
  code: 'VALIDATION_ERROR';
  field: string;
  value: any;
}

export interface AmadeusAPIError extends MCPError {
  code: 'AMADEUS_API_ERROR';
  statusCode: number;
  amadeusErrorCode?: string;
}

export interface NetworkError extends MCPError {
  code: 'NETWORK_ERROR';
  originalError: Error;
}

// Configuration Types
export interface ServerConfig {
  amadeus: {
    clientId: string;
    clientSecret: string;
    environment: 'test' | 'production';
  };
  mcp: {
    name: string;
    version: string;
    description: string;
  };
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
  };
  rateLimit: {
    requestsPerMinute: number;
    burst: number;
  };
}
