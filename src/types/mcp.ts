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

// Enums for type safety
export enum TripType {
  ONE_WAY = 'ONE_WAY',
  ROUND_TRIP = 'ROUND_TRIP',
  MULTI_CITY = 'MULTI_CITY'
}

export enum TravelClass {
  ECONOMY = 'ECONOMY',
  PREMIUM_ECONOMY = 'PREMIUM_ECONOMY',
  BUSINESS = 'BUSINESS',
  FIRST = 'FIRST'
}

export enum TravelerType {
  ADULT = 'ADULT',
  CHILD = 'CHILD',
  SENIOR = 'SENIOR',
  YOUNG = 'YOUNG',
  HELD_INFANT = 'HELD_INFANT',
  SEATED_INFANT = 'SEATED_INFANT',
  STUDENT = 'STUDENT'
}

export enum TravelInfoType {
  AIRPORT = 'AIRPORT',
  AIRLINE = 'AIRLINE',
  FLIGHT_OFFER = 'FLIGHT_OFFER'
}

export enum ExploreSearchType {
  CHEAPEST_DATES = 'CHEAPEST_DATES',
  DESTINATION_INSPIRATION = 'DESTINATION_INSPIRATION',
  FLEXIBLE_SEARCH = 'FLEXIBLE_SEARCH'
}

// Consolidated Tool Parameter Types
export interface FindFlightsParams {
  tripType: TripType;
  // Simple trip parameters (for ONE_WAY and ROUND_TRIP)
  origin?: string;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  // Multi-city parameters (for MULTI_CITY)
  segments?: Array<{
    origin: string;
    destination: string;
    date: string;
    time?: string;
  }>;
  // Passenger information
  passengers: {
    adults: number;
    children?: number;
    infants?: number;
  };
  // Preferences
  preferences?: {
    travelClass?: TravelClass;
    nonStop?: boolean;
    maxPrice?: number;
    currency?: string;
  };
  // For getting specific offer details
  offerId?: string;
  max?: number;
}

export interface ExploreTravelOptionsParams {
  searchType: ExploreSearchType;
  origin: string;
  destination?: string;
  departureDate: string;
  returnDate?: string;
  oneWay?: boolean;
  nonStop?: boolean;
  duration?: string;
  viewBy?: 'DURATION' | 'DATE' | 'DESTINATION';
  maxPrice?: number;
  aggregationMode?: 'DAY' | 'DESTINATION' | 'WEEK';
  passengers?: {
    adults: number;
    children?: number;
    infants?: number;
  };
}

export interface GetTravelInfoParams {
  infoType: TravelInfoType;
  // For AIRPORT
  keyword?: string;
  countryCode?: string;
  // For AIRLINE
  airlineCodes?: string;
  // For FLIGHT_OFFER
  offerId?: string;
  max?: number;
}

// Legacy types (kept for backward compatibility during transition)
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
