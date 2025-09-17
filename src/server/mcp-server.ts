import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { completable } from '@modelcontextprotocol/sdk/server/completable.js';
import { z } from 'zod';
import { AmadeusClient } from '../services/amadeus-client.js';
import { FlightSearchTool } from './tools/flight-search.js';
import { ServerConfig } from '../types/mcp.js';
import { ErrorHandler } from '../utils/error-handler.js';

export class AmadeusFlightsMCPServer {
  private server: Server;
  private amadeusClient: AmadeusClient;
  private flightSearchTool: FlightSearchTool;

  constructor(config: ServerConfig) {
    this.server = new Server(
      {
        name: config.mcp.name,
        version: config.mcp.version,
      },
      {
        capabilities: {
          tools: {},
          prompts: {},
        },
      }
    );

    this.amadeusClient = new AmadeusClient(config);
    this.flightSearchTool = new FlightSearchTool(this.amadeusClient);

    this.setupToolHandlers();
    this.setupPromptHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'search_flights',
            description: 'PRIMARY TOOL for finding flights between airports. Use this tool when users ask for "flights from X to Y", "best flights", "cheapest flights", or any flight search request. This tool returns complete flight information including prices, schedules, airlines, and booking details. Common airport codes: LAX (Los Angeles), SEA (Seattle), JFK (New York), LHR (London), CDG (Paris). Only use other tools if you need additional information not provided by this search.',
            inputSchema: {
              type: 'object',
              properties: {
                origin: {
                  type: 'string',
                  description: 'Origin airport IATA code (e.g., LAX for Los Angeles, SEA for Seattle, JFK for New York). Use common codes directly - LAX, SEA, JFK, LHR, CDG, etc.',
                  minLength: 3,
                  maxLength: 3
                },
                destination: {
                  type: 'string',
                  description: 'Destination airport IATA code (e.g., SEA for Seattle, LAX for Los Angeles, JFK for New York). Use common codes directly - LAX, SEA, JFK, LHR, CDG, etc.',
                  minLength: 3,
                  maxLength: 3
                },
                departureDate: {
                  type: 'string',
                  description: 'Departure date in YYYY-MM-DD format',
                  pattern: '^\\d{4}-\\d{2}-\\d{2}$'
                },
                adults: {
                  type: 'integer',
                  description: 'Number of adult passengers',
                  minimum: 1,
                  maximum: 9
                },
                children: {
                  type: 'integer',
                  description: 'Number of child passengers',
                  minimum: 0,
                  maximum: 8
                },
                infants: {
                  type: 'integer',
                  description: 'Number of infant passengers',
                  minimum: 0,
                  maximum: 8
                },
                returnDate: {
                  type: 'string',
                  description: 'Return date in YYYY-MM-DD format (for round trip)',
                  pattern: '^\\d{4}-\\d{2}-\\d{2}$'
                },
                travelClass: {
                  type: 'string',
                  description: 'Travel class',
                  enum: ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']
                },
                nonStop: {
                  type: 'boolean',
                  description: 'Search for non-stop flights only'
                },
                maxPrice: {
                  type: 'number',
                  description: 'Maximum price filter'
                },
                currencyCode: {
                  type: 'string',
                  description: 'Currency code (e.g., USD, EUR)',
                  minLength: 3,
                  maxLength: 3
                },
                max: {
                  type: 'integer',
                  description: 'Maximum number of results to return',
                  minimum: 1,
                  maximum: 250
                }
              },
              required: ['origin', 'destination', 'departureDate', 'adults']
            }
          },
          {
            name: 'get_flight_offers',
            description: 'Get detailed information about specific flight offers by their ID. Use this tool to retrieve complete details of a flight offer that was previously found through search_flights.',
            inputSchema: {
              type: 'object',
              properties: {
                offerId: {
                  type: 'string',
                  description: 'Flight offer ID'
                }
              },
              required: ['offerId']
            }
          },
          {
            name: 'search_airports',
            description: 'ONLY use this tool when you need to find airport codes for city names (e.g., "Seattle" → "SEA"). Do NOT use this tool if you already have airport codes. This tool is for converting city names to IATA codes before using search_flights.',
            inputSchema: {
              type: 'object',
              properties: {
                keyword: {
                  type: 'string',
                  description: 'Search keyword (airport name, city, or IATA code)',
                  minLength: 1,
                  maxLength: 100
                },
                countryCode: {
                  type: 'string',
                  description: 'Country code to filter results (e.g., US, GB)',
                  minLength: 2,
                  maxLength: 2
                },
                max: {
                  type: 'integer',
                  description: 'Maximum number of results to return',
                  minimum: 1,
                  maximum: 100
                }
              },
              required: ['keyword']
            }
          },
          {
            name: 'get_airlines',
            description: 'ONLY use this tool when you need detailed airline information (like full airline names) for specific airline codes. Do NOT use this tool for general flight searches - search_flights already provides airline information.',
            inputSchema: {
              type: 'object',
              properties: {
                airlineCodes: {
                  type: 'string',
                  description: 'Comma-separated airline codes (e.g., BA,AA,DL)'
                },
                max: {
                  type: 'integer',
                  description: 'Maximum number of results to return',
                  minimum: 1,
                  maximum: 100
                }
              }
            }
          },
          {
            name: 'search_multi_city_flights',
            description: 'Search for multi-city flight combinations with multiple stops. Use this tool for complex itineraries with multiple destinations and stops. IMPORTANT: Always use sources: ["GDS"] for traditional airlines. Example: {"originDestinations": [...], "travelers": [...], "sources": ["GDS"]}',
            inputSchema: {
              type: 'object',
              properties: {
                originDestinations: {
                  type: 'array',
                  description: 'Array of origin-destination pairs',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      originLocationCode: { type: 'string', minLength: 3, maxLength: 3 },
                      destinationLocationCode: { type: 'string', minLength: 3, maxLength: 3 },
                      departureDateTimeRange: {
                        type: 'object',
                        properties: {
                          date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
                          time: { type: 'string', pattern: '^\\d{2}:\\d{2}$' }
                        },
                        required: ['date']
                      }
                    },
                    required: ['id', 'originLocationCode', 'destinationLocationCode', 'departureDateTimeRange']
                  },
                  minItems: 1,
                  maxItems: 6
                },
                travelers: {
                  type: 'array',
                  description: 'Array of travelers',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      travelerType: {
                        type: 'string',
                        enum: ['ADULT', 'CHILD', 'SENIOR', 'YOUNG', 'HELD_INFANT', 'SEATED_INFANT', 'STUDENT']
                      }
                    },
                    required: ['id', 'travelerType']
                  },
                  minItems: 1,
                  maxItems: 9
                },
                sources: {
                  type: 'array',
                  description: 'REQUIRED: Data sources to search. Use ["GDS"] for traditional airlines. DO NOT use other values.',
                  items: { 
                    type: 'string',
                    enum: ['GDS']
                  },
                  minItems: 1,
                  default: ['GDS'],
                  examples: [['GDS']]
                }
              },
              required: ['originDestinations', 'travelers', 'sources']
            }
          },
          {
            name: 'search_flight_cheapest_dates',
            description: 'ONLY use this tool when users specifically ask for "cheapest dates" or "when is the cheapest time to fly". Do NOT use this tool for regular flight searches - use search_flights instead.',
            inputSchema: {
              type: 'object',
              properties: {
                origin: {
                  type: 'string',
                  description: 'Origin airport IATA code',
                  minLength: 3,
                  maxLength: 3
                },
                destination: {
                  type: 'string',
                  description: 'Destination airport IATA code',
                  minLength: 3,
                  maxLength: 3
                },
                departureDate: {
                  type: 'string',
                  description: 'Departure date in YYYY-MM-DD format',
                  pattern: '^\\d{4}-\\d{2}-\\d{2}$'
                },
                returnDate: {
                  type: 'string',
                  description: 'Return date in YYYY-MM-DD format',
                  pattern: '^\\d{4}-\\d{2}-\\d{2}$'
                },
                oneWay: {
                  type: 'boolean',
                  description: 'One-way trip only'
                },
                nonStop: {
                  type: 'boolean',
                  description: 'Non-stop flights only'
                },
                maxPrice: {
                  type: 'number',
                  description: 'Maximum price filter'
                }
              },
              required: ['origin', 'destination', 'departureDate']
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        let result;

        switch (name) {
          case 'search_flights':
            result = await this.flightSearchTool.searchFlights(args);
            break;
          case 'get_flight_offers':
            result = await this.flightSearchTool.getFlightOffers(args);
            break;
          case 'search_airports':
            result = await this.flightSearchTool.searchAirports(args);
            break;
          case 'get_airlines':
            result = await this.flightSearchTool.getAirlines(args);
            break;
          case 'search_multi_city_flights':
            result = await this.flightSearchTool.searchMultiCityFlights(args);
            break;
          case 'search_flight_cheapest_dates':
            result = await this.flightSearchTool.searchFlightCheapestDates(args);
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        // Return proper MCP response format
        return {
          content: result.content || [{
            type: 'text',
            text: 'Tool executed successfully'
          }]
        };
      } catch (error: any) {
        const mcpError = ErrorHandler.handleError(error);
        ErrorHandler.logError(mcpError, `tool:${name}`);
        
        return {
          content: [{
            type: 'text',
            text: `Error: ${mcpError.message}`
          }]
        };
      }
    });
  }

  private setupPromptHandlers(): void {
    // List available prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: [
          {
            name: 'format-flight-results',
            description: 'Format flight search results with airline information, departure/arrival times, and layover details in a user-friendly format',
            arguments: [
              {
                name: 'flightData',
                description: 'Flight search results data to format',
                required: true
              },
              {
                name: 'includeDetails',
                description: 'Whether to include detailed information like aircraft type and terminal info',
                required: false
              }
            ]
          }
        ]
      };
    });

    // Handle prompt requests
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'format-flight-results':
            return this.formatFlightResultsPrompt(args);
          default:
            throw new Error(`Unknown prompt: ${name}`);
        }
      } catch (error: any) {
        const mcpError = ErrorHandler.handleError(error);
        ErrorHandler.logError(mcpError, `prompt:${name}`);
        
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
    });
  }

  public formatFlightResultsPrompt(args: any): any {
    const { flightData, includeDetails = true } = args;
    
    // Parse flight data if it's a string
    let flights;
    try {
      flights = typeof flightData === 'string' ? JSON.parse(flightData) : flightData;
    } catch (error) {
      flights = flightData;
    }

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
    const formattedResults = this.formatFlightResults(flightOffers, includeDetails);
    
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
    this.server.onerror = (error) => {
      console.error('MCP Server Error:', error);
    };

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
