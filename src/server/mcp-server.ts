import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { AmadeusClient } from '../services/amadeus-client.js';
import { FlightSearchTool } from './tools/flight-search.js';
import { ServerConfig } from '../types/mcp.js';
import { ErrorHandler } from '../utils/error-handler.js';
import { 
  FormatFlightResultsArgs, 
  FlightSearchAssistanceArgs, 
  CompareFlightsArgs, 
  TravelPlanningArgs,
  PromptResponse 
} from '../types/prompts.js';

export class AmadeusFlightsMCPServer {
  private server: McpServer;
  private amadeusClient: AmadeusClient;
  private flightSearchTool: FlightSearchTool;

  constructor(config: ServerConfig) {
    this.server = new McpServer({
        name: config.mcp.name,
        version: config.mcp.version,
    }, {
      capabilities: {
        prompts: {
          listChanged: true
        }
      }
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
    this.server.registerPrompt(
      'format-flight-results',
      {
        title: 'Format Flight Results',
        description: 'Format flight search results with airline information, departure/arrival times, and layover details in a user-friendly format',
        argsSchema: {
          flightData: z.string().describe('Flight search results data to format'),
          includeDetails: z.string().optional().describe('Whether to include detailed information like aircraft type and terminal info (true/false)')
        }
      },
      async (args) => {
        try {
          return this.formatFlightResultsPrompt(args as FormatFlightResultsArgs);
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

    // Flight search assistance prompt
    this.server.registerPrompt(
      'flight-search-assistance',
      {
        title: 'Flight Search Assistance',
        description: 'Get help with flight search parameters and find the best flights for your travel needs',
        argsSchema: {
          origin: z.string().optional().describe('Origin city or airport code'),
          destination: z.string().optional().describe('Destination city or airport code'),
          departureDate: z.string().optional().describe('Preferred departure date (YYYY-MM-DD)'),
          returnDate: z.string().optional().describe('Preferred return date for round trip (YYYY-MM-DD)'),
          passengers: z.string().optional().describe('Number of passengers'),
          travelClass: z.string().optional().describe('Preferred travel class (ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST)'),
          budget: z.string().optional().describe('Maximum budget for the trip'),
          preferences: z.string().optional().describe('Any specific preferences or requirements')
        }
      },
      async (args) => {
        try {
          return this.flightSearchAssistancePrompt(args as FlightSearchAssistanceArgs);
        } catch (error: any) {
          const mcpError = ErrorHandler.handleError(error);
          ErrorHandler.logError(mcpError, 'prompt:flight-search-assistance');
          
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

    // Flight comparison prompt
    this.server.registerPrompt(
      'compare-flights',
      {
        title: 'Compare Flight Options',
        description: 'Compare multiple flight options side by side to help you make the best choice',
        argsSchema: {
          flightOptions: z.string().describe('JSON string of flight options to compare'),
          criteria: z.string().optional().describe('Comparison criteria (price, duration, stops, etc.)')
        }
      },
      async (args) => {
        try {
          return this.compareFlightsPrompt(args as CompareFlightsArgs);
        } catch (error: any) {
          const mcpError = ErrorHandler.handleError(error);
          ErrorHandler.logError(mcpError, 'prompt:compare-flights');
          
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

    // Travel planning prompt
    this.server.registerPrompt(
      'travel-planning',
      {
        title: 'Travel Planning Assistant',
        description: 'Get comprehensive travel planning assistance including flight recommendations, timing, and tips',
        argsSchema: {
          destination: z.string().describe('Travel destination'),
          origin: z.string().optional().describe('Origin city or airport'),
          travelDates: z.string().optional().describe('Preferred travel dates or date range'),
          tripDuration: z.string().optional().describe('Length of stay'),
          travelers: z.string().optional().describe('Number and type of travelers'),
          interests: z.string().optional().describe('Travel interests and activities'),
          budget: z.string().optional().describe('Budget range for the trip')
        }
      },
      async (args) => {
        try {
          return this.travelPlanningPrompt(args as TravelPlanningArgs);
        } catch (error: any) {
          const mcpError = ErrorHandler.handleError(error);
          ErrorHandler.logError(mcpError, 'prompt:travel-planning');
          
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

    // Simple text prompts - direct instructions to client LLM
    this.server.registerPrompt(
      'sort-by-price',
      {
        title: 'Sort Flights by Price',
        description: 'Get instructions to sort flight results by price with airline and timing details'
      },
      async () => {
        return {
          messages: [{
            role: 'user',
            content: {
              type: 'text',
              text: "I'd like to see options sorted by price, with information about the airlines, departure/arrival times, and any layovers."
            }
          }]
        };
      }
    );

    this.server.registerPrompt(
      'find-cheapest',
      {
        title: 'Find Cheapest Flights',
        description: 'Get instructions to find the most affordable flight options'
      },
      async () => {
        return {
          messages: [{
            role: 'user',
            content: {
              type: 'text',
              text: "Please find the cheapest flight options available. I'm flexible with dates and times, and I'm looking for the best value for money."
            }
          }]
        };
      }
    );

    this.server.registerPrompt(
      'non-stop-preferred',
      {
        title: 'Non-Stop Flights Preferred',
        description: 'Get instructions to prioritize non-stop flights'
      },
      async () => {
        return {
          messages: [{
            role: 'user',
            content: {
              type: 'text',
              text: "I prefer non-stop flights when possible. Please show me direct flight options first, and only include connecting flights if they offer significant savings or better timing."
            }
          }]
        };
      }
    );

    this.server.registerPrompt(
      'business-class-search',
      {
        title: 'Business Class Search',
        description: 'Get instructions to search for business class flights'
      },
      async () => {
        return {
          messages: [{
            role: 'user',
            content: {
              type: 'text',
              text: "I'm looking for business class flights. Please show me options with comfortable seating, priority boarding, and good value for the premium experience."
            }
          }]
        };
      }
    );

    this.server.registerPrompt(
      'flexible-dates',
      {
        title: 'Flexible Date Search',
        description: 'Get instructions to search with flexible travel dates'
      },
      async () => {
        return {
          messages: [{
            role: 'user',
            content: {
              type: 'text',
              text: "I have flexible travel dates. Please help me find the best flight options by checking different departure and return dates to get the best prices and availability."
            }
          }]
        };
      }
    );

    this.server.registerPrompt(
      'morning-flights',
      {
        title: 'Morning Flights Only',
        description: 'Get instructions to search for morning departure flights'
      },
      async () => {
        return {
          messages: [{
            role: 'user',
            content: {
              type: 'text',
              text: "I prefer morning flights. Please show me options with departures before 12:00 PM, as I like to arrive at my destination early in the day."
            }
          }]
        };
      }
    );

    this.server.registerPrompt(
      'weekend-trip',
      {
        title: 'Weekend Trip Planning',
        description: 'Get instructions for planning a weekend getaway'
      },
      async () => {
        return {
          messages: [{
            role: 'user',
            content: {
              type: 'text',
              text: "I'm planning a weekend trip. Please help me find flights that work well for a Friday departure and Sunday return, maximizing my time at the destination."
            }
          }]
        };
      }
    );

    this.server.registerPrompt(
      'family-travel',
      {
        title: 'Family Travel Planning',
        description: 'Get instructions for family-friendly flight options'
      },
      async () => {
        return {
          messages: [{
            role: 'user',
            content: {
              type: 'text',
              text: "I'm traveling with family including children. Please help me find flights that are family-friendly with reasonable layover times, good seat selection options, and consider the needs of young travelers."
            }
          }]
        };
      }
    );

    this.server.registerPrompt(
      'last-minute-travel',
      {
        title: 'Last Minute Travel',
        description: 'Get instructions for urgent or last-minute flight searches'
      },
      async () => {
        return {
          messages: [{
            role: 'user',
            content: {
              type: 'text',
              text: "I need to travel urgently. Please help me find available flights for immediate or near-term travel, considering both price and availability for emergency travel situations."
            }
          }]
        };
      }
    );
  }

  public formatFlightResultsPrompt(args: FormatFlightResultsArgs): PromptResponse {
    const { flightData, includeDetails = 'true' } = args;
    
    // Parse flight data if it's a string
    let flights;
    try {
      flights = typeof flightData === 'string' ? JSON.parse(flightData) : flightData;
    } catch (error) {
      flights = flightData;
    }
    
    // Parse includeDetails string to boolean
    const includeDetailsBool = includeDetails === 'true' || includeDetails === '1';

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

  public flightSearchAssistancePrompt(args: FlightSearchAssistanceArgs): PromptResponse {
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      passengers = '1',
      travelClass = 'ECONOMY',
      budget,
      preferences
    } = args;

    let prompt = "I'll help you find the best flights for your travel needs. Here's what I can assist you with:\n\n";

    if (origin && destination) {
      prompt += `**Route:** ${origin} → ${destination}\n`;
    } else if (origin) {
      prompt += `**Origin:** ${origin}\n`;
    } else if (destination) {
      prompt += `**Destination:** ${destination}\n`;
    }

    if (departureDate) {
      prompt += `**Departure Date:** ${departureDate}\n`;
    }

    if (returnDate) {
      prompt += `**Return Date:** ${returnDate}\n`;
    }

    prompt += `**Passengers:** ${passengers}\n`;
    prompt += `**Travel Class:** ${travelClass}\n`;

    if (budget) {
      prompt += `**Budget:** $${budget}\n`;
    }

    if (preferences) {
      prompt += `**Preferences:** ${preferences}\n`;
    }

    prompt += "\n**I can help you with:**\n";
    prompt += "• Finding the best flight options\n";
    prompt += "• Comparing prices across different airlines\n";
    prompt += "• Suggesting optimal travel dates\n";
    prompt += "• Finding non-stop vs connecting flights\n";
    prompt += "• Identifying the cheapest travel periods\n";
    prompt += "• Providing travel tips and recommendations\n\n";

    prompt += "To get started, I'll need to search for flights. Would you like me to:\n";
    prompt += "1. Search for flights with your current parameters\n";
    prompt += "2. Find the cheapest dates for your route\n";
    prompt += "3. Compare different travel options\n";
    prompt += "4. Get recommendations for your specific needs\n\n";

    prompt += "Just let me know what you'd like to do, and I'll use the flight search tools to find the best options for you!";

    return {
      messages: [{
        role: 'assistant',
        content: {
          type: 'text',
          text: prompt
        }
      }]
    };
  }

  public compareFlightsPrompt(args: CompareFlightsArgs): PromptResponse {
    const { flightOptions, criteria = 'price, duration, stops' } = args;
    
    let flights;
    try {
      flights = typeof flightOptions === 'string' ? JSON.parse(flightOptions) : flightOptions;
    } catch (error) {
      return {
        messages: [{
          role: 'assistant',
          content: {
            type: 'text',
            text: 'Error: Invalid flight options data. Please provide valid JSON format.'
          }
        }]
      };
    }

    if (!Array.isArray(flights) || flights.length === 0) {
      return {
        messages: [{
          role: 'assistant',
          content: {
            type: 'text',
            text: 'No flight options provided for comparison.'
          }
        }]
      };
    }

    let comparison = "## ✈️ Flight Comparison\n\n";
    comparison += `**Comparison Criteria:** ${criteria}\n\n`;

    // Create comparison table
    comparison += "| Option | Airline | Price | Duration | Stops | Departure | Arrival |\n";
    comparison += "|--------|---------|-------|----------|-------|-----------|----------|\n";

    flights.forEach((flight: any, index: number) => {
      const price = flight.price?.total || 'N/A';
      const currency = flight.price?.currency || '';
      const duration = flight.itineraries?.[0]?.duration || 'N/A';
      const stops = flight.itineraries?.[0]?.segments?.length - 1 || 0;
      const airline = flight.itineraries?.[0]?.segments?.[0]?.carrierCode || 'N/A';
      const departure = flight.itineraries?.[0]?.segments?.[0]?.departure?.at || 'N/A';
      const arrival = flight.itineraries?.[0]?.segments?.[flight.itineraries[0].segments.length - 1]?.arrival?.at || 'N/A';

      comparison += `| ${index + 1} | ${airline} | ${currency} ${price} | ${duration} | ${stops} | ${departure} | ${arrival} |\n`;
    });

    comparison += "\n**Recommendations:**\n";
    
    // Find best options based on criteria
    const criteriaList = criteria.toLowerCase().split(',').map(c => c.trim());
    
    if (criteriaList.includes('price')) {
      const cheapest = flights.reduce((min, flight) => 
        (flight.price?.total || Infinity) < (min.price?.total || Infinity) ? flight : min
      );
      comparison += `• **Best Price:** Option ${flights.indexOf(cheapest) + 1} - ${cheapest.price?.currency} ${cheapest.price?.total}\n`;
    }

    if (criteriaList.includes('duration')) {
      const fastest = flights.reduce((min, flight) => {
        const duration = flight.itineraries?.[0]?.duration || '';
        const minDuration = min.itineraries?.[0]?.duration || '';
        return duration < minDuration ? flight : min;
      });
      comparison += `• **Shortest Duration:** Option ${flights.indexOf(fastest) + 1} - ${fastest.itineraries?.[0]?.duration}\n`;
    }

    if (criteriaList.includes('stops')) {
      const nonStop = flights.find(flight => 
        flight.itineraries?.[0]?.segments?.length === 1
      );
      if (nonStop) {
        comparison += `• **Non-stop Option:** Option ${flights.indexOf(nonStop) + 1}\n`;
      }
    }

    comparison += "\n**Tips:**\n";
    comparison += "• Consider total travel time including layovers\n";
    comparison += "• Check baggage policies and fees\n";
    comparison += "• Verify terminal information for connections\n";
    comparison += "• Book early for better prices and seat selection\n";

    return {
      messages: [{
        role: 'assistant',
        content: {
          type: 'text',
          text: comparison
        }
      }]
    };
  }

  public travelPlanningPrompt(args: TravelPlanningArgs): PromptResponse {
    const {
      destination,
      origin,
      travelDates,
      tripDuration,
      travelers,
      interests,
      budget
    } = args;

    let prompt = `# 🗺️ Travel Planning for ${destination}\n\n`;

    if (origin) {
      prompt += `**From:** ${origin}\n`;
    }
    prompt += `**To:** ${destination}\n`;

    if (travelDates) {
      prompt += `**Travel Dates:** ${travelDates}\n`;
    }

    if (tripDuration) {
      prompt += `**Trip Duration:** ${tripDuration}\n`;
    }

    if (travelers) {
      prompt += `**Travelers:** ${travelers}\n`;
    }

    if (interests) {
      prompt += `**Interests:** ${interests}\n`;
    }

    if (budget) {
      prompt += `**Budget:** ${budget}\n`;
    }

    prompt += "\n## 🎯 Planning Recommendations\n\n";

    prompt += "### Flight Search Strategy\n";
    prompt += "1. **Flexible Dates:** If your dates are flexible, I can help you find the cheapest travel periods\n";
    prompt += "2. **Multiple Airports:** Consider nearby airports for better options and prices\n";
    prompt += "3. **Booking Timing:** Book 2-3 months in advance for domestic, 3-6 months for international\n";
    prompt += "4. **Day of Week:** Tuesday and Wednesday often have better prices\n\n";

    prompt += "### Travel Tips\n";
    prompt += "• **Passport/ID:** Ensure all travelers have valid identification\n";
    prompt += "• **Visa Requirements:** Check visa requirements for your destination\n";
    prompt += "• **Travel Insurance:** Consider travel insurance for international trips\n";
    prompt += "• **Health Requirements:** Check vaccination and health requirements\n";
    prompt += "• **Currency:** Research local currency and exchange rates\n\n";

    if (interests) {
      prompt += "### Activity Suggestions\n";
      prompt += `Based on your interests in ${interests}, consider:\n`;
      prompt += "• Researching local attractions and activities\n";
      prompt += "• Booking tours or experiences in advance\n";
      prompt += "• Checking seasonal events and festivals\n";
      prompt += "• Finding local restaurants and cultural sites\n\n";
    }

    prompt += "### Next Steps\n";
    prompt += "1. **Search Flights:** I can help you find the best flight options\n";
    prompt += "2. **Compare Prices:** We can compare different airlines and dates\n";
    prompt += "3. **Find Deals:** Look for special offers and promotions\n";
    prompt += "4. **Plan Itinerary:** Create a detailed travel itinerary\n\n";

    prompt += "Would you like me to start by searching for flights to ${destination}?";

    return {
      messages: [{
        role: 'assistant',
        content: {
          type: 'text',
          text: prompt
        }
      }]
    };
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
