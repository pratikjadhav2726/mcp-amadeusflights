import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { AmadeusClient } from '../services/amadeus-client.js';
import { FlightSearchTool } from './tools/flight-search.js';
import { ServerConfig } from '../types/mcp.js';
import { ErrorHandler } from '../utils/error-handler.js';

export class AmadeusFlightsMCPServer {
  private server: McpServer;
  private amadeusClient: AmadeusClient;
  private flightSearchTool: FlightSearchTool;

  constructor(config: ServerConfig) {
    this.server = new McpServer({
        name: config.mcp.name,
        version: config.mcp.version,
    });

    this.amadeusClient = new AmadeusClient(config);
    this.flightSearchTool = new FlightSearchTool(this.amadeusClient);

    this.setupTools();
    this.setupPrompts();
    this.setupErrorHandling();
  }

  private setupTools(): void {
    // Search flights tool
    this.server.tool(
      'search_flights',
      'PRIMARY TOOL for finding flights between airports. Use this tool when users ask for "flights from X to Y", "best flights", "cheapest flights", or any flight search request. This tool returns complete flight information including prices, schedules, airlines, and booking details. Common airport codes: LAX (Los Angeles), SEA (Seattle), JFK (New York), LHR (London), CDG (Paris). Only use other tools if you need additional information not provided by this search.',
      {
        origin: z.string().min(3).max(3).describe('Origin airport IATA code (e.g., LAX for Los Angeles, SEA for Seattle, JFK for New York). Use common codes directly - LAX, SEA, JFK, LHR, CDG, etc.'),
        destination: z.string().min(3).max(3).describe('Destination airport IATA code (e.g., SEA for Seattle, LAX for Los Angeles, JFK for New York). Use common codes directly - LAX, SEA, JFK, LHR, CDG, etc.'),
        departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Departure date in YYYY-MM-DD format'),
        adults: z.number().int().min(1).max(9).describe('Number of adult passengers'),
        children: z.number().int().min(0).max(8).optional().describe('Number of child passengers'),
        infants: z.number().int().min(0).max(8).optional().describe('Number of infant passengers'),
        returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Return date in YYYY-MM-DD format (for round trip)'),
        travelClass: z.enum(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']).optional().describe('Travel class'),
        nonStop: z.boolean().optional().describe('Search for non-stop flights only'),
        maxPrice: z.number().optional().describe('Maximum price filter'),
        currencyCode: z.string().min(3).max(3).optional().describe('Currency code (e.g., USD, EUR)'),
        max: z.number().int().min(1).max(250).optional().describe('Maximum number of results to return')
      },
      async (args) => {
        try {
          const result = await this.flightSearchTool.searchFlights(args);
          return {
            content: result.content || [{
              type: 'text',
              text: 'Tool executed successfully'
            }]
          };
        } catch (error: any) {
          const mcpError = ErrorHandler.handleError(error);
          ErrorHandler.logError(mcpError, 'tool:search_flights');
          return {
            content: [{
              type: 'text',
              text: `Error: ${mcpError.message}`
            }]
          };
        }
      }
    );
    // Get flight offers tool
    this.server.tool(
      'get_flight_offers',
      'Get detailed information about specific flight offers by their ID. Use this tool to retrieve complete details of a flight offer that was previously found through search_flights.',
      {
        offerId: z.string().describe('Flight offer ID')
      },
      async (args) => {
        try {
          const result = await this.flightSearchTool.getFlightOffers(args);
          return {
            content: result.content || [{
              type: 'text',
              text: 'Tool executed successfully'
            }]
          };
        } catch (error: any) {
          const mcpError = ErrorHandler.handleError(error);
          ErrorHandler.logError(mcpError, 'tool:get_flight_offers');
          return {
            content: [{
              type: 'text',
              text: `Error: ${mcpError.message}`
            }]
          };
        }
      }
    );
    // Search airports tool
    this.server.tool(
      'search_airports',
      'ONLY use this tool when you need to find airport codes for city names (e.g., "Seattle" → "SEA"). Do NOT use this tool if you already have airport codes. This tool is for converting city names to IATA codes before using search_flights.',
      {
        keyword: z.string().min(1).max(100).describe('Search keyword (airport name, city, or IATA code)'),
        countryCode: z.string().min(2).max(2).optional().describe('Country code to filter results (e.g., US, GB)'),
        max: z.number().int().min(1).max(100).optional().describe('Maximum number of results to return')
      },
      async (args) => {
        try {
          const result = await this.flightSearchTool.searchAirports(args);
          return {
            content: result.content || [{
              type: 'text',
              text: 'Tool executed successfully'
            }]
          };
        } catch (error: any) {
          const mcpError = ErrorHandler.handleError(error);
          ErrorHandler.logError(mcpError, 'tool:search_airports');
          return {
            content: [{
              type: 'text',
              text: `Error: ${mcpError.message}`
            }]
          };
        }
      }
    );
    // Get airlines tool
    this.server.tool(
      'get_airlines',
      'ONLY use this tool when you need detailed airline information (like full airline names) for specific airline codes. Do NOT use this tool for general flight searches - search_flights already provides airline information.',
      {
        airlineCodes: z.string().optional().describe('Comma-separated airline codes (e.g., BA,AA,DL)'),
        max: z.number().int().min(1).max(100).optional().describe('Maximum number of results to return')
      },
      async (args) => {
        try {
          const result = await this.flightSearchTool.getAirlines(args);
          return {
            content: result.content || [{
              type: 'text',
              text: 'Tool executed successfully'
            }]
          };
        } catch (error: any) {
          const mcpError = ErrorHandler.handleError(error);
          ErrorHandler.logError(mcpError, 'tool:get_airlines');
          return {
            content: [{
              type: 'text',
              text: `Error: ${mcpError.message}`
            }]
          };
        }
      }
    );
    // Search multi-city flights tool
    this.server.tool(
      'search_multi_city_flights',
      'Search for multi-city flight combinations with multiple stops. Use this tool for complex itineraries with multiple destinations and stops. IMPORTANT: Always use sources: ["GDS"] for traditional airlines. Example: {"originDestinations": [...], "travelers": [...], "sources": ["GDS"]}',
      {
        originDestinations: z.array(z.object({
          id: z.string(),
          originLocationCode: z.string().min(3).max(3),
          destinationLocationCode: z.string().min(3).max(3),
          departureDateTimeRange: z.object({
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            time: z.string().regex(/^\d{2}:\d{2}$/).optional()
          })
        })).min(1).max(6).describe('Array of origin-destination pairs'),
        travelers: z.array(z.object({
          id: z.string(),
          travelerType: z.enum(['ADULT', 'CHILD', 'SENIOR', 'YOUNG', 'HELD_INFANT', 'SEATED_INFANT', 'STUDENT'])
        })).min(1).max(9).describe('Array of travelers'),
        sources: z.array(z.literal('GDS')).min(1).default(['GDS']).describe('REQUIRED: Data sources to search. Use ["GDS"] for traditional airlines. DO NOT use other values.')
      },
      async (args) => {
        try {
          const result = await this.flightSearchTool.searchMultiCityFlights(args);
          return {
            content: result.content || [{
              type: 'text',
              text: 'Tool executed successfully'
            }]
          };
        } catch (error: any) {
          const mcpError = ErrorHandler.handleError(error);
          ErrorHandler.logError(mcpError, 'tool:search_multi_city_flights');
          return {
            content: [{
              type: 'text',
              text: `Error: ${mcpError.message}`
            }]
          };
        }
      }
    );
    // Search flight cheapest dates tool
    this.server.tool(
      'search_flight_cheapest_dates',
      'ONLY use this tool when users specifically ask for "cheapest dates" or "when is the cheapest time to fly". Do NOT use this tool for regular flight searches - use search_flights instead.',
      {
        origin: z.string().min(3).max(3).describe('Origin airport IATA code'),
        destination: z.string().min(3).max(3).describe('Destination airport IATA code'),
        departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Departure date in YYYY-MM-DD format'),
        returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Return date in YYYY-MM-DD format'),
        oneWay: z.boolean().optional().describe('One-way trip only'),
        nonStop: z.boolean().optional().describe('Non-stop flights only'),
        maxPrice: z.number().optional().describe('Maximum price filter')
      },
      async (args) => {
        try {
          const result = await this.flightSearchTool.searchFlightCheapestDates(args);
        return {
          content: result.content || [{
            type: 'text',
            text: 'Tool executed successfully'
          }]
        };
      } catch (error: any) {
        const mcpError = ErrorHandler.handleError(error);
          ErrorHandler.logError(mcpError, 'tool:search_flight_cheapest_dates');
        return {
          content: [{
            type: 'text',
            text: `Error: ${mcpError.message}`
          }]
        };
      }
      }
    );
  }

  private setupPrompts(): void {
    // Format flight results prompt
    this.server.prompt(
      'format-flight-results',
      'Format flight search results with airline information, departure/arrival times, and layover details in a user-friendly format',
      {
        flightData: z.string().describe('Flight search results data to format'),
        includeDetails: z.string().optional().describe('Whether to include detailed information like aircraft type and terminal info')
      },
      async (args) => {
        try {
            return this.formatFlightResultsPrompt(args);
      } catch (error: any) {
        const mcpError = ErrorHandler.handleError(error);
          ErrorHandler.logError(mcpError, 'prompt:format-flight-results');
        
        return {
          messages: [{
            role: 'assistant',
            content: {
              type: 'text',
              text: `Error: ${mcpError.message}`
            }
          }]
        };
      }
      }
    );
  }

  public formatFlightResultsPrompt(args: any): any {
    const { flightData, includeDetails = 'true' } = args;
    
    // Parse flight data if it's a string
    let flights;
    try {
      flights = typeof flightData === 'string' ? JSON.parse(flightData) : flightData;
    } catch (error) {
      flights = flightData;
    }
    
    // Parse includeDetails string to boolean
    const includeDetailsBool = includeDetails === 'true' || includeDetails === true;

    // Ensure we have flight offers
    const flightOffers = flights?.data || flights?.flightOffers || flights || [];
    
    if (!Array.isArray(flightOffers) || flightOffers.length === 0) {
      return {
        messages: [{
          role: 'assistant',
          content: {
            type: 'text',
            text: 'No flight results found to format.'
          }
        }]
      };
    }

    // Format the flight results
    const formattedResults = this.formatFlightResults(flightOffers, includeDetailsBool);
    
    return {
      messages: [{
        role: 'assistant',
        content: {
          type: 'text',
          text: formattedResults
        }
      }]
    };
  }

  private formatFlightResults(flightOffers: any[], includeDetails: boolean): string {
    let result = '## ✈️ Flight Search Results\n\n';
    
    flightOffers.forEach((offer, index) => {
      result += `### Option ${index + 1}\n`;
      result += `**Price:** ${offer.price?.currency} ${offer.price?.total}\n`;
      result += `**Bookable Seats:** ${offer.numberOfBookableSeats}\n\n`;
      
      if (offer.itineraries) {
        offer.itineraries.forEach((itinerary: any, itineraryIndex: number) => {
          if (offer.itineraries.length > 1) {
            result += `#### ${itineraryIndex === 0 ? 'Outbound' : 'Return'} Journey\n`;
          }
          
          result += `**Total Duration:** ${itinerary.duration}\n\n`;
          
          if (itinerary.segments) {
            itinerary.segments.forEach((segment: any, segmentIndex: number) => {
              result += `**Flight ${segmentIndex + 1}:**\n`;
              result += `• **Airline:** ${segment.carrierCode} ${segment.number}`;
              
              // Add airline name if available in dictionaries
              if (offer.dictionaries?.carriers?.[segment.carrierCode]) {
                result += ` (${offer.dictionaries.carriers[segment.carrierCode].businessName})`;
              }
              result += '\n';
              
              result += `• **Route:** ${segment.departure.iataCode} → ${segment.arrival.iataCode}\n`;
              result += `• **Departure:** ${this.formatDateTime(segment.departure.at)}`;
              if (segment.departure.terminal) {
                result += ` (Terminal ${segment.departure.terminal})`;
              }
              result += '\n';
              
              result += `• **Arrival:** ${this.formatDateTime(segment.arrival.at)}`;
              if (segment.arrival.terminal) {
                result += ` (Terminal ${segment.arrival.terminal})`;
              }
              result += '\n';
              
              result += `• **Duration:** ${segment.duration}\n`;
              result += `• **Stops:** ${segment.numberOfStops === 0 ? 'Non-stop' : `${segment.numberOfStops} stop${segment.numberOfStops > 1 ? 's' : ''}`}\n`;
              
              if (includeDetails) {
                if (segment.aircraft?.code) {
                  result += `• **Aircraft:** ${segment.aircraft.code}\n`;
                }
                if (segment.operating?.carrierCode && segment.operating.carrierCode !== segment.carrierCode) {
                  result += `• **Operated by:** ${segment.operating.carrierCode}\n`;
                }
              }
              
              // Add layover information
              if (segmentIndex < itinerary.segments.length - 1) {
                const nextSegment = itinerary.segments[segmentIndex + 1];
                const layoverTime = this.calculateLayoverTime(segment.arrival.at, nextSegment.departure.at);
                result += `• **Layover:** ${layoverTime} at ${segment.arrival.iataCode}\n`;
              }
              
              result += '\n';
            });
          }
          
          result += '---\n\n';
        });
      }
    });
    
    return result;
  }

  private formatDateTime(dateTimeString: string): string {
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
    } catch (error) {
      return dateTimeString;
    }
  }

  private calculateLayoverTime(arrivalTime: string, departureTime: string): string {
    try {
      const arrival = new Date(arrivalTime);
      const departure = new Date(departureTime);
      const diffMs = departure.getTime() - arrival.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (diffHours > 0) {
        return `${diffHours}h ${diffMinutes}m`;
      } else {
        return `${diffMinutes}m`;
      }
    } catch (error) {
      return 'Unknown';
    }
  }

  private setupErrorHandling(): void {
    // McpServer handles errors internally, but we can still set up global error handlers
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Amadeus Flights MCP Server started');
  }

  async stop(): Promise<void> {
    await this.server.close();
    console.error('Amadeus Flights MCP Server stopped');
  }
}
