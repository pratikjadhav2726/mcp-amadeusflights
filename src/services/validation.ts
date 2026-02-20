import { z } from 'zod';
import { TripType, TravelClass, TravelInfoType, ExploreSearchType } from '../types/mcp.js';

// Date validation schema
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

// Airport code validation schema (accepts both city names and codes)
const airportCodeSchema = z.string().min(1, 'Airport code or city name is required').max(100);

// Travel class validation schema
const travelClassSchema = z.enum(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']);

// Passenger count validation schema
const passengerCountSchema = z.number().int().min(1, 'Passenger count must be at least 1').max(9, 'Maximum 9 passengers allowed');

// Currency code validation schema
const currencyCodeSchema = z.string().length(3, 'Currency code must be exactly 3 characters').toUpperCase();

// Search Flights Parameters Schema
export const searchFlightsSchema = z.object({
  origin: airportCodeSchema,
  destination: airportCodeSchema,
  departureDate: dateSchema,
  adults: passengerCountSchema,
  children: z.number().int().min(0).max(8).optional(),
  infants: z.number().int().min(0).max(8).optional(),
  returnDate: dateSchema.optional(),
  travelClass: travelClassSchema.optional(),
  nonStop: z.boolean().optional(),
  maxPrice: z.number().positive().optional(),
  currencyCode: currencyCodeSchema.optional(),
  max: z.number().int().min(1).max(250).optional()
}).refine(
  (data) => {
    if (data.children && data.children > 0 && data.adults === 0) {
      return false;
    }
    if (data.infants && data.infants > 0 && data.adults === 0) {
      return false;
    }
    return true;
  },
  {
    message: 'Adults must be at least 1 when children or infants are present',
    path: ['adults']
  }
).refine(
  (data) => {
    if (data.returnDate && data.departureDate >= data.returnDate) {
      return false;
    }
    return true;
  },
  {
    message: 'Return date must be after departure date',
    path: ['returnDate']
  }
);

// Get Flight Offers Parameters Schema
export const getFlightOffersSchema = z.object({
  offerId: z.string().min(1, 'Offer ID is required')
});

// Search Airports Parameters Schema
export const searchAirportsSchema = z.object({
  keyword: z.string().min(1, 'Keyword is required').max(100, 'Keyword too long'),
  countryCode: z.string().length(2, 'Country code must be exactly 2 characters').toUpperCase().optional(),
  max: z.number().int().min(1).max(100).optional()
});

// Get Airline Codes Parameters Schema
export const getAirlineCodesSchema = z.object({
  airlineCodes: z.string().optional(),
  max: z.number().int().min(1).max(100).optional()
});

// Search Multi-City Flights Parameters Schema
export const searchMultiCityFlightsSchema = z.object({
  originDestinations: z.array(z.object({
    id: z.string().min(1, 'Origin destination ID is required'),
    originLocationCode: airportCodeSchema,
    destinationLocationCode: airportCodeSchema,
    departureDateTimeRange: z.object({
      date: dateSchema,
      time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format').optional()
    })
  })).min(1, 'At least one origin destination is required').max(6, 'Maximum 6 origin destinations allowed'),
  travelers: z.array(z.object({
    id: z.string().min(1, 'Traveler ID is required'),
    travelerType: z.enum(['ADULT', 'CHILD', 'SENIOR', 'YOUNG', 'HELD_INFANT', 'SEATED_INFANT', 'STUDENT'])
  })).min(1, 'At least one traveler is required').max(9, 'Maximum 9 travelers allowed'),
  sources: z.array(z.enum(['GDS'])).min(1, 'At least one source is required').default(['GDS']),
  searchCriteria: z.object({
    maxFlightOffers: z.number().int().min(1).max(250).optional(),
    flightFilters: z.object({
      cabinRestrictions: z.array(z.object({
        cabin: travelClassSchema,
        coverage: z.enum(['MOST_SEGMENTS', 'AT_LEAST_ONE_SEGMENT', 'ALL_SEGMENTS']),
        originDestinationIds: z.array(z.string())
      })).optional()
    }).optional()
  }).optional()
});

// Get Flight Inspiration Parameters Schema
export const getFlightInspirationSchema = z.object({
  origin: airportCodeSchema,
  destination: airportCodeSchema.optional(),
  departureDate: dateSchema.optional(),
  duration: z.string().regex(/^\d+[DW]$/, 'Duration must be in format like 7D or 2W').optional(),
  oneWay: z.boolean().optional(),
  nonStop: z.boolean().optional(),
  viewBy: z.enum(['DURATION', 'DATE', 'DESTINATION']).optional(),
  maxPrice: z.number().positive().optional(),
  aggregationMode: z.enum(['DAY', 'DESTINATION', 'WEEK']).optional()
});

// Search Flight Cheapest Dates Parameters Schema
export const searchFlightCheapestDatesSchema = z.object({
  origin: airportCodeSchema,
  destination: airportCodeSchema,
  departureDate: dateSchema,
  returnDate: dateSchema.optional(),
  oneWay: z.boolean().optional(),
  nonStop: z.boolean().optional(),
  duration: z.string().regex(/^\d+[DW]$/, 'Duration must be in format like 7D or 2W').optional(),
  viewBy: z.enum(['DURATION', 'DATE', 'DESTINATION']).optional(),
  maxPrice: z.number().positive().optional(),
  aggregationMode: z.enum(['DAY', 'DESTINATION', 'WEEK']).optional()
}).refine(
  (data) => {
    if (data.returnDate && data.departureDate >= data.returnDate) {
      return false;
    }
    return true;
  },
  {
    message: 'Return date must be after departure date',
    path: ['returnDate']
  }
);

// Validation helper function
export function validateParams<T>(schema: z.ZodSchema<T>, params: unknown): T {
  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = {
        code: 'VALIDATION_ERROR',
        message: 'Invalid parameters provided',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          value: (err as any).input
        }))
      };
      throw validationError;
    }
    throw error;
  }
}

// Consolidated Tool Schemas

// Find Flights Schema (consolidates search_flights + search_multi_city_flights + get_flight_offers)
export const findFlightsSchema = z.object({
  tripType: z.enum(['ONE_WAY', 'ROUND_TRIP', 'MULTI_CITY']),
  // Simple trip parameters
  origin: airportCodeSchema.optional(),
  destination: airportCodeSchema.optional(),
  departureDate: dateSchema.optional(),
  returnDate: dateSchema.optional(),
  // Multi-city parameters
  segments: z.array(z.object({
    origin: airportCodeSchema,
    destination: airportCodeSchema,
    date: dateSchema,
    time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format').optional()
  })).optional(),
  // Passenger information
  passengers: z.object({
    adults: passengerCountSchema,
    children: z.number().int().min(0).max(8).optional(),
    infants: z.number().int().min(0).max(8).optional()
  }),
  // Preferences
  preferences: z.object({
    travelClass: travelClassSchema.optional(),
    nonStop: z.boolean().optional(),
    maxPrice: z.number().positive().optional(),
    currency: currencyCodeSchema.optional()
  }).optional(),
  // For getting specific offer details
  offerId: z.string().optional(),
  max: z.number().int().min(1).max(250).optional()
}).refine(
  (data) => {
    // For ONE_WAY and ROUND_TRIP, origin, destination, and departureDate are required
    if (data.tripType !== 'MULTI_CITY') {
      if (!data.origin || !data.destination || !data.departureDate) {
        return false;
      }
      if (data.tripType === 'ROUND_TRIP' && !data.returnDate) {
        return false;
      }
    } else {
      // For MULTI_CITY, segments are required
      if (!data.segments || data.segments.length === 0) {
        return false;
      }
    }
    return true;
  },
  {
    message: 'For ONE_WAY/ROUND_TRIP: origin, destination, and departureDate are required. For MULTI_CITY: segments are required.',
    path: ['tripType']
  }
).refine(
  (data) => {
    if (data.returnDate && data.departureDate && data.departureDate >= data.returnDate) {
      return false;
    }
    return true;
  },
  {
    message: 'Return date must be after departure date',
    path: ['returnDate']
  }
).refine(
  (data) => {
    if (data.passengers.children && data.passengers.children > 0 && data.passengers.adults === 0) {
      return false;
    }
    if (data.passengers.infants && data.passengers.infants > 0 && data.passengers.adults === 0) {
      return false;
    }
    return true;
  },
  {
    message: 'Adults must be at least 1 when children or infants are present',
    path: ['passengers']
  }
);

// Explore Travel Options Schema (consolidates search_flight_cheapest_dates)
export const exploreTravelOptionsSchema = z.object({
  searchType: z.enum(['CHEAPEST_DATES', 'DESTINATION_INSPIRATION', 'FLEXIBLE_SEARCH']),
  origin: airportCodeSchema,
  destination: airportCodeSchema.optional(),
  departureDate: dateSchema,
  returnDate: dateSchema.optional(),
  oneWay: z.boolean().optional(),
  nonStop: z.boolean().optional(),
  duration: z.string().regex(/^\d+[DW]$/, 'Duration must be in format like 7D or 2W').optional(),
  viewBy: z.enum(['DURATION', 'DATE', 'DESTINATION']).optional(),
  maxPrice: z.number().positive().optional(),
  aggregationMode: z.enum(['DAY', 'DESTINATION', 'WEEK']).optional(),
  passengers: z.object({
    adults: passengerCountSchema,
    children: z.number().int().min(0).max(8).optional(),
    infants: z.number().int().min(0).max(8).optional()
  }).optional()
}).refine(
  (data) => {
    if (data.returnDate && data.departureDate >= data.returnDate) {
      return false;
    }
    return true;
  },
  {
    message: 'Return date must be after departure date',
    path: ['returnDate']
  }
);

// Get Travel Info Schema (consolidates search_airports + get_airlines)
export const getTravelInfoSchema = z.object({
  infoType: z.enum(['AIRPORT', 'AIRLINE', 'FLIGHT_OFFER']),
  // For AIRPORT
  keyword: z.string().min(1).max(100).optional(),
  countryCode: z.string().length(2, 'Country code must be exactly 2 characters').toUpperCase().optional(),
  // For AIRLINE
  airlineCodes: z.string().optional(),
  // For FLIGHT_OFFER
  offerId: z.string().optional(),
  max: z.number().int().min(1).max(100).optional()
}).refine(
  (data) => {
    if (data.infoType === 'AIRPORT' && !data.keyword) {
      return false;
    }
    if (data.infoType === 'FLIGHT_OFFER' && !data.offerId) {
      return false;
    }
    return true;
  },
  {
    message: 'keyword is required for AIRPORT, offerId is required for FLIGHT_OFFER',
    path: ['infoType']
  }
);

// Type exports for use in other modules
export type SearchFlightsParams = z.infer<typeof searchFlightsSchema>;
export type GetFlightOffersParams = z.infer<typeof getFlightOffersSchema>;
export type SearchAirportsParams = z.infer<typeof searchAirportsSchema>;
export type GetAirlineCodesParams = z.infer<typeof getAirlineCodesSchema>;
export type SearchMultiCityFlightsParams = z.infer<typeof searchMultiCityFlightsSchema>;
export type GetFlightInspirationParams = z.infer<typeof getFlightInspirationSchema>;
export type SearchFlightCheapestDatesParams = z.infer<typeof searchFlightCheapestDatesSchema>;
export type FindFlightsParams = z.infer<typeof findFlightsSchema>;
export type ExploreTravelOptionsParams = z.infer<typeof exploreTravelOptionsSchema>;
export type GetTravelInfoParams = z.infer<typeof getTravelInfoSchema>;
