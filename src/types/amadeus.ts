// Amadeus API Response Types
export interface FlightOffer {
  id: string;
  source: string;
  instantTicketingRequired: boolean;
  nonHomogeneous: boolean;
  oneWay: boolean;
  lastTicketingDate: string;
  numberOfBookableSeats: number;
  itineraries: Itinerary[];
  price: Price;
  pricingOptions: PricingOptions;
  validatingAirlineCodes: string[];
  travelerPricings: TravelerPricing[];
}

export interface Itinerary {
  duration: string;
  segments: Segment[];
}

export interface Segment {
  departure: Location;
  arrival: Location;
  carrierCode: string;
  number: string;
  aircraft: Aircraft;
  operating: Operating;
  duration: string;
  id: string;
  numberOfStops: number;
  blacklistedInEU: boolean;
}

export interface Location {
  iataCode: string;
  terminal?: string;
  at: string;
}

export interface Aircraft {
  code: string;
}

export interface Operating {
  carrierCode: string;
}

export interface Price {
  currency: string;
  total: string;
  base: string;
  fees: Fee[];
  grandTotal: string;
}

export interface Fee {
  amount: string;
  type: string;
}

export interface PricingOptions {
  fareType: string[];
  includedCheckedBagsOnly: boolean;
}

export interface TravelerPricing {
  travelerId: string;
  fareOption: string;
  travelerType: string;
  price: Price;
  fareDetailsBySegment: FareDetailsBySegment[];
}

export interface FareDetailsBySegment {
  segmentId: string;
  cabin: string;
  fareBasis: string;
  class: string;
  includedCheckedBags: CheckedBags;
}

export interface CheckedBags {
  weight: number;
  weightUnit: string;
}

export interface Airport {
  iataCode: string;
  name: string;
  detailedName: string;
  timeZoneOffset: string;
  address: Address;
  distance?: Distance;
  type: string;
  subType: string;
  id: string;
  geoCode: {
    latitude: number;
    longitude: number;
  };
}

export interface Address {
  cityName: string;
  cityCode: string;
  countryName: string;
  countryCode: string;
  regionCode: string;
  stateCode?: string;
}

export interface Distance {
  value: number;
  unit: string;
}

export interface Airline {
  iataCode: string;
  icaoCode: string;
  businessName: string;
  commonName: string;
}

// Request Parameters
export interface FlightSearchParams {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  nonStop?: boolean;
  maxPrice?: number;
  currencyCode?: string;
  max?: number;
}

export interface AirportSearchParams {
  keyword: string;
  countryCode?: string;
  max?: number;
}

export interface AirlineSearchParams {
  airlineCodes?: string;
  max?: number;
}

// API Response Wrapper
export interface AmadeusResponse<T> {
  data: T[];
  meta: {
    count: number;
    links: {
      self: string;
    };
  };
  dictionaries?: {
    locations?: Record<string, Airport>;
    aircraft?: Record<string, Aircraft>;
    currencies?: Record<string, string>;
    carriers?: Record<string, Airline>;
  };
}
