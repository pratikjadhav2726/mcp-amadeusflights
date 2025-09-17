import { z } from 'zod';
import { AmadeusClient } from '../../services/amadeus-client.js';
import { ResponseFormatter } from '../../utils/formatters.js';
import { ErrorHandler, withRetry } from '../../utils/error-handler.js';
import { validateParams, searchFlightsSchema } from '../../services/validation.js';
import { MCPToolResult } from '../../types/mcp.js';

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
      
      const response = await withRetry(
        () => this.amadeusClient.getAirlines({
          airlineCodes: validatedParams.airlineCodes,
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
}
