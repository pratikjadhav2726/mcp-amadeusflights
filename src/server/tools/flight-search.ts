import { z } from 'zod';
import { AmadeusClient } from '../../services/amadeus-client.js';
import { ResponseFormatter } from '../../utils/formatters.js';
import { ErrorHandler, withRetry } from '../../utils/error-handler.js';
import { 
  validateParams, 
  searchFlightsSchema,
  findFlightsSchema,
  exploreTravelOptionsSchema,
  getTravelInfoSchema
} from '../../services/validation.js';
import { MCPToolResult, TripType, TravelInfoType, ExploreSearchType } from '../../types/mcp.js';

export class FlightSearchTool {
  constructor(private amadeusClient: AmadeusClient) {}

  /**
   * Search for flights
   */
  async searchFlights(params: unknown): Promise<MCPToolResult> {
    try {
      const validatedParams = validateParams(searchFlightsSchema, params);
      
      const response = await withRetry(
        () => this.amadeusClient.searchFlights({
          originLocationCode: validatedParams.origin,
          destinationLocationCode: validatedParams.destination,
          departureDate: validatedParams.departureDate,
          returnDate: validatedParams.returnDate,
          adults: validatedParams.adults,
          children: validatedParams.children,
          infants: validatedParams.infants,
          travelClass: validatedParams.travelClass,
          nonStop: validatedParams.nonStop,
          maxPrice: validatedParams.maxPrice,
          currencyCode: validatedParams.currencyCode,
          max: validatedParams.max
        }),
        3,
        'searchFlights'
      );

      return ResponseFormatter.formatFlightOffers(response);
    } catch (error: any) {
      ErrorHandler.logError(ErrorHandler.handleError(error), 'searchFlights');
      return ResponseFormatter.formatError(error);
    }
  }

  /**
   * Get flight offers by ID
   */
  async getFlightOffers(params: unknown): Promise<MCPToolResult> {
    try {
      const schema = z.object({
        offerId: z.string().min(1, 'Offer ID is required')
      });
      
      const validatedParams = validateParams(schema, params);
      
      const response = await withRetry(
        () => this.amadeusClient.getFlightOffers(validatedParams.offerId),
        3,
        'getFlightOffers'
      );

      return ResponseFormatter.formatFlightOffers(response);
    } catch (error: any) {
      ErrorHandler.logError(ErrorHandler.handleError(error), 'getFlightOffers');
      return ResponseFormatter.formatError(error);
    }
  }

  /**
   * Search for airports
   */
  async searchAirports(params: unknown): Promise<MCPToolResult> {
    try {
      const schema = z.object({
        keyword: z.string().min(1, 'Keyword is required').max(100, 'Keyword too long'),
        countryCode: z.string().length(2, 'Country code must be exactly 2 characters').toUpperCase().optional(),
        max: z.number().int().min(1).max(100).optional()
      });
      
      const validatedParams = validateParams(schema, params);
      
      const response = await withRetry(
        () => this.amadeusClient.searchAirports({
          keyword: validatedParams.keyword,
          countryCode: validatedParams.countryCode,
          max: validatedParams.max
        }),
        3,
        'searchAirports'
      );

      return ResponseFormatter.formatAirports(response);
    } catch (error: any) {
      ErrorHandler.logError(ErrorHandler.handleError(error), 'searchAirports');
      return ResponseFormatter.formatError(error);
    }
  }

  /**
   * Get airline information
   */
  async getAirlines(params: unknown): Promise<MCPToolResult> {
    try {
      const schema = z.object({
        airlineCodes: z.string().optional(),
        max: z.number().int().min(1).max(100).optional()
      });
      
      const validatedParams = validateParams(schema, params);
      
      // Truncate airline codes to first two characters if provided
      let processedAirlineCodes = validatedParams.airlineCodes;
      if (processedAirlineCodes) {
        processedAirlineCodes = processedAirlineCodes
          .split(',')
          .map(code => code.trim().substring(0, 2))
          .join(',');
      }
      
      const response = await withRetry(
        () => this.amadeusClient.getAirlines({
          airlineCodes: processedAirlineCodes,
          max: validatedParams.max
        }),
        3,
        'getAirlines'
      );

      return ResponseFormatter.formatAirlines(response);
    } catch (error: any) {
      ErrorHandler.logError(ErrorHandler.handleError(error), 'getAirlines');
      return ResponseFormatter.formatError(error);
    }
  }

  /**
   * Search for multi-city flights
   */
  async searchMultiCityFlights(params: unknown): Promise<MCPToolResult> {
    try {
      const schema = z.object({
        originDestinations: z.array(z.object({
          id: z.string().min(1, 'Origin destination ID is required'),
          originLocationCode: z.string().length(3, 'Airport code must be exactly 3 characters').toUpperCase(),
          destinationLocationCode: z.string().length(3, 'Airport code must be exactly 3 characters').toUpperCase(),
          departureDateTimeRange: z.object({
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
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
              cabin: z.enum(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']),
              coverage: z.enum(['MOST_SEGMENTS', 'AT_LEAST_ONE_SEGMENT', 'ALL_SEGMENTS']),
              originDestinationIds: z.array(z.string())
            })).optional()
          }).optional()
        }).optional()
      });
      
      const validatedParams = validateParams(schema, params);
      
      const response = await withRetry(
        () => this.amadeusClient.searchMultiCityFlights(validatedParams),
        3,
        'searchMultiCityFlights'
      );

      return ResponseFormatter.formatFlightOffers(response);
    } catch (error: any) {
      ErrorHandler.logError(ErrorHandler.handleError(error), 'searchMultiCityFlights');
      return ResponseFormatter.formatError(error);
    }
  }

  /**
   * Search for cheapest flight dates
   * Note: This API has limited route coverage and only works with pre-computed cached routes
   */
  async searchFlightCheapestDates(params: unknown): Promise<MCPToolResult> {
    let validatedParams: any = null;
    
    try {
      const schema = z.object({
        origin: z.string().length(3, 'Airport code must be exactly 3 characters').toUpperCase(),
        destination: z.string().length(3, 'Airport code must be exactly 3 characters').toUpperCase(),
        departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
        returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
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
      
      validatedParams = validateParams(schema, params);
      
      const response = await this.amadeusClient.searchFlightCheapestDates(validatedParams);

      return ResponseFormatter.formatFlightCheapestDates(response);
    } catch (error: any) {
      // Handle specific errors for cheapest dates API
      if (error.name === 'UnsupportedRouteError' || error.name === 'SystemError') {
        const routeInfo = validatedParams ? 
          `${validatedParams.origin} → ${validatedParams.destination}` : 
          'the specified route';
        
        const fallbackMessage = `The cheapest dates search is not available for ${routeInfo}. ` +
          `This is because the Flight Dates API only works with pre-computed cached routes. ` +
          `For broader coverage, consider using the regular flight search API instead.`;
        
        return {
          content: [{
            type: 'text',
            text: `⚠️ ${fallbackMessage}\n\n` +
                  `Alternative: Use the regular flight search with different dates to find the best prices. ` +
                  `The regular flight search API supports all routes but requires specific dates.`
          }]
        };
      }
      
      ErrorHandler.logError(ErrorHandler.handleError(error), 'searchFlightCheapestDates');
      return ResponseFormatter.formatError(error);
    }
  }

  /**
   * Consolidated method: Find flights (handles simple trips, multi-city, and offer details)
   */
  async findFlights(params: unknown): Promise<MCPToolResult> {
    try {
      const validatedParams = validateParams(findFlightsSchema, params);
      
      // If offerId is provided, get specific offer details
      if (validatedParams.offerId) {
        return await this.getFlightOffers({ offerId: validatedParams.offerId });
      }

      // Handle multi-city trips
      if (validatedParams.tripType === TripType.MULTI_CITY) {
        if (!validatedParams.segments || validatedParams.segments.length === 0) {
          throw new Error('Segments are required for multi-city trips');
        }

        const originDestinations = validatedParams.segments.map((segment, index) => ({
          id: `${index + 1}`,
          originLocationCode: segment.origin.length === 3 ? segment.origin.toUpperCase() : segment.origin,
          destinationLocationCode: segment.destination.length === 3 ? segment.destination.toUpperCase() : segment.destination,
          departureDateTimeRange: {
            date: segment.date,
            time: segment.time
          }
        }));

        const travelers = [];
        let travelerId = 1;
        
        // Add adults
        for (let i = 0; i < validatedParams.passengers.adults; i++) {
          travelers.push({ id: `${travelerId++}`, travelerType: 'ADULT' });
        }
        
        // Add children
        if (validatedParams.passengers.children) {
          for (let i = 0; i < validatedParams.passengers.children; i++) {
            travelers.push({ id: `${travelerId++}`, travelerType: 'CHILD' });
          }
        }
        
        // Add infants
        if (validatedParams.passengers.infants) {
          for (let i = 0; i < validatedParams.passengers.infants; i++) {
            travelers.push({ id: `${travelerId++}`, travelerType: 'HELD_INFANT' });
          }
        }

        const multiCityParams = {
          originDestinations,
          travelers,
          sources: ['GDS'] as const,
          searchCriteria: {
            maxFlightOffers: validatedParams.max || 50,
            flightFilters: validatedParams.preferences?.travelClass ? {
              cabinRestrictions: [{
                cabin: validatedParams.preferences.travelClass,
                coverage: 'ALL_SEGMENTS' as const,
                originDestinationIds: originDestinations.map(od => od.id)
              }]
            } : undefined
          }
        };

        const response = await withRetry(
          () => this.amadeusClient.searchMultiCityFlights(multiCityParams),
          3,
          'findFlights:multiCity'
        );

        return ResponseFormatter.formatFlightOffers(response);
      }

      // Handle simple one-way or round-trip
      if (!validatedParams.origin || !validatedParams.destination || !validatedParams.departureDate) {
        throw new Error('Origin, destination, and departureDate are required for simple trips');
      }

      // Resolve airport codes if needed (if not 3-letter codes, treat as city names)
      let originCode = validatedParams.origin;
      let destinationCode = validatedParams.destination;

      // If codes are not 3 letters, they might be city names - would need airport lookup
      // For now, assume they're codes and let the API handle validation
      if (originCode.length !== 3) {
        // Could add airport lookup here, but for now pass through
        originCode = originCode.toUpperCase();
      } else {
        originCode = originCode.toUpperCase();
      }

      if (destinationCode.length !== 3) {
        destinationCode = destinationCode.toUpperCase();
      } else {
        destinationCode = destinationCode.toUpperCase();
      }

      const searchParams = {
        originLocationCode: originCode,
        destinationLocationCode: destinationCode,
        departureDate: validatedParams.departureDate,
        returnDate: validatedParams.returnDate,
        adults: validatedParams.passengers.adults,
        children: validatedParams.passengers.children,
        infants: validatedParams.passengers.infants,
        travelClass: validatedParams.preferences?.travelClass,
        nonStop: validatedParams.preferences?.nonStop,
        maxPrice: validatedParams.preferences?.maxPrice,
        currencyCode: validatedParams.preferences?.currency,
        max: validatedParams.max || 50
      };

      const response = await withRetry(
        () => this.amadeusClient.searchFlights(searchParams),
        3,
        'findFlights:simple'
      );

      return ResponseFormatter.formatFlightOffers(response);
    } catch (error: any) {
      ErrorHandler.logError(ErrorHandler.handleError(error), 'findFlights');
      return ResponseFormatter.formatError(error);
    }
  }

  /**
   * Consolidated method: Explore travel options (cheapest dates, inspiration, flexible search)
   */
  async exploreTravelOptions(params: unknown): Promise<MCPToolResult> {
    let validatedParams: any = null;
    
    try {
      validatedParams = validateParams(exploreTravelOptionsSchema, params);

      // Currently only CHEAPEST_DATES is implemented
      if (validatedParams.searchType === ExploreSearchType.CHEAPEST_DATES) {
        if (!validatedParams.destination) {
          throw new Error('Destination is required for cheapest dates search');
        }

        const cheapestDatesParams = {
          origin: validatedParams.origin.length === 3 
            ? validatedParams.origin.toUpperCase() 
            : validatedParams.origin.toUpperCase(),
          destination: validatedParams.destination.length === 3
            ? validatedParams.destination.toUpperCase()
            : validatedParams.destination.toUpperCase(),
          departureDate: validatedParams.departureDate,
          returnDate: validatedParams.returnDate,
          oneWay: validatedParams.oneWay,
          nonStop: validatedParams.nonStop,
          duration: validatedParams.duration,
          viewBy: validatedParams.viewBy,
          maxPrice: validatedParams.maxPrice,
          aggregationMode: validatedParams.aggregationMode
        };

        const response = await this.amadeusClient.searchFlightCheapestDates(cheapestDatesParams);
        return ResponseFormatter.formatFlightCheapestDates(response);
      }

      // Future: Add DESTINATION_INSPIRATION and FLEXIBLE_SEARCH implementations
      throw new Error(`Search type ${validatedParams.searchType} is not yet implemented`);
    } catch (error: any) {
      // Handle specific errors for cheapest dates API
      if (error.name === 'UnsupportedRouteError' || error.name === 'SystemError') {
        const routeInfo = validatedParams?.origin && validatedParams?.destination
          ? `${validatedParams.origin} → ${validatedParams.destination}`
          : 'the specified route';
        
        const fallbackMessage = `The cheapest dates search is not available for ${routeInfo}. ` +
          `This is because the Flight Dates API only works with pre-computed cached routes. ` +
          `For broader coverage, consider using the regular flight search API instead.`;
        
        return {
          content: [{
            type: 'text',
            text: `⚠️ ${fallbackMessage}\n\n` +
                  `Alternative: Use the regular flight search with different dates to find the best prices. ` +
                  `The regular flight search API supports all routes but requires specific dates.`
          }]
        };
      }

      ErrorHandler.logError(ErrorHandler.handleError(error), 'exploreTravelOptions');
      return ResponseFormatter.formatError(error);
    }
  }

  /**
   * Consolidated method: Get travel information (airports, airlines, flight offers)
   */
  async getTravelInfo(params: unknown): Promise<MCPToolResult> {
    try {
      const validatedParams = validateParams(getTravelInfoSchema, params);

      if (validatedParams.infoType === TravelInfoType.AIRPORT) {
        if (!validatedParams.keyword) {
          throw new Error('Keyword is required for airport search');
        }

        const airportParams = {
          keyword: validatedParams.keyword,
          countryCode: validatedParams.countryCode,
          max: validatedParams.max
        };

        const response = await withRetry(
          () => this.amadeusClient.searchAirports(airportParams),
          3,
          'getTravelInfo:airport'
        );

        return ResponseFormatter.formatAirports(response);
      }

      if (validatedParams.infoType === TravelInfoType.AIRLINE) {
        let processedAirlineCodes = validatedParams.airlineCodes;
        if (processedAirlineCodes) {
          processedAirlineCodes = processedAirlineCodes
            .split(',')
            .map(code => code.trim().substring(0, 2))
            .join(',');
        }

        const airlineParams = {
          airlineCodes: processedAirlineCodes,
          max: validatedParams.max
        };

        const response = await withRetry(
          () => this.amadeusClient.getAirlines(airlineParams),
          3,
          'getTravelInfo:airline'
        );

        return ResponseFormatter.formatAirlines(response);
      }

      if (validatedParams.infoType === TravelInfoType.FLIGHT_OFFER) {
        if (!validatedParams.offerId) {
          throw new Error('Offer ID is required for flight offer details');
        }

        return await this.getFlightOffers({ offerId: validatedParams.offerId });
      }

      throw new Error(`Info type ${validatedParams.infoType} is not supported`);
    } catch (error: any) {
      ErrorHandler.logError(ErrorHandler.handleError(error), 'getTravelInfo');
      return ResponseFormatter.formatError(error);
    }
  }
}
