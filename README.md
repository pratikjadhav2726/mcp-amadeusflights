# MCP Amadeus Flights Server v1.1.0

A comprehensive Model Context Protocol (MCP) server that provides advanced flight search capabilities and intelligent prompts to Large Language Models (LLMs) using the Amadeus Node.js SDK.

## 🚀 **NEW in v1.1.0: Advanced MCP Server with Registered Prompts**

This release introduces comprehensive prompt registration, enhanced MCP SDK 1.18.0 integration, and intelligent LLM interaction capabilities. The server now provides both powerful tools and context-aware prompts for seamless AI assistant integration.

## Features

### 🔍 **Flight Search Capabilities**
- **Flight Search**: Search for flights between airports with flexible parameters
- **Airport Lookup**: Find airports by name, city, or IATA code
- **Airline Information**: Get detailed airline information
- **Multi-City Flights**: Search for complex multi-city flight combinations
- **Flight Inspiration**: Discover flight destinations based on budget and preferences
- **Cheapest Dates**: Find the most affordable travel dates for specific routes

### 🎯 **NEW: Intelligent Prompt System**
- **10+ Registered Prompts**: Context-aware prompts for different travel scenarios
- **Parameterized Prompts**: Advanced prompts with structured arguments
- **Quick Action Prompts**: Simple prompts for common travel needs
- **LLM Integration**: Seamless integration with AI assistants

### 🛠️ **Technical Excellence**
- **MCP SDK 1.18.0**: Full compatibility with latest MCP features
- **Comprehensive Error Handling**: Robust error management with retry logic
- **Input Validation**: Strong type safety and parameter validation
- **TypeScript Support**: Complete type safety and IntelliSense support

## Available Tools

### 1. `search_flights`
Search for flight offers between two airports.

**Parameters:**
- `origin` (required): Origin airport IATA code (e.g., "LHR")
- `destination` (required): Destination airport IATA code (e.g., "JFK")
- `departureDate` (required): Departure date in YYYY-MM-DD format
- `adults` (required): Number of adult passengers (1-9)
- `children` (optional): Number of child passengers (0-8)
- `infants` (optional): Number of infant passengers (0-8)
- `returnDate` (optional): Return date for round-trip flights
- `travelClass` (optional): Economy, Premium Economy, Business, or First
- `nonStop` (optional): Search for non-stop flights only
- `maxPrice` (optional): Maximum price filter
- `currencyCode` (optional): Currency code (e.g., "USD", "EUR")
- `max` (optional): Maximum number of results (1-250)

### 2. `get_flight_offers`
Get detailed information about specific flight offers.

**Parameters:**
- `offerId` (required): Flight offer ID

### 3. `search_airports`
Search for airports by keyword or city name.

**Parameters:**
- `keyword` (required): Search keyword (airport name, city, or IATA code)
- `countryCode` (optional): Country code to filter results (e.g., "US", "GB")
- `max` (optional): Maximum number of results (1-100)

### 4. `get_airlines`
Get airline information by codes.

**Parameters:**
- `airlineCodes` (optional): Comma-separated airline codes (e.g., "BA,AA,DL")
- `max` (optional): Maximum number of results (1-100)

### 5. `search_multi_city_flights`
Search for multi-city flight combinations.

**Parameters:**
- `originDestinations` (required): Array of origin-destination pairs
- `travelers` (required): Array of travelers with types
- `sources` (required): Data sources to search

### 6. `search_flight_cheapest_dates`
Find cheapest dates for a specific route.

**Parameters:**
- `origin` (required): Origin airport IATA code
- `destination` (required): Destination airport IATA code
- `departureDate` (required): Departure date in YYYY-MM-DD format
- `returnDate` (optional): Return date for round-trip flights
- `oneWay` (optional): One-way trip only
- `nonStop` (optional): Non-stop flights only
- `maxPrice` (optional): Maximum price filter

## 🎯 **NEW: Registered Prompts for Enhanced LLM Interaction**

The server now includes 10+ intelligent prompts that provide context-aware assistance for different travel scenarios:

### 📋 **Advanced Prompts (with Parameters)**

#### 1. `format-flight-results`
Format flight search results with airline information, departure/arrival times, and layover details.

**Parameters:**
- `flightData` (required): Flight search results data to format
- `includeDetails` (optional): Whether to include detailed information like aircraft type and terminal info (true/false)

#### 2. `flight-search-assistance`
Get help with flight search parameters and find the best flights for your travel needs.

**Parameters:**
- `origin` (optional): Origin city or airport code
- `destination` (optional): Destination city or airport code
- `departureDate` (optional): Preferred departure date (YYYY-MM-DD)
- `returnDate` (optional): Preferred return date for round trip (YYYY-MM-DD)
- `passengers` (optional): Number of passengers
- `travelClass` (optional): Preferred travel class (ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST)
- `budget` (optional): Maximum budget for the trip
- `preferences` (optional): Any specific preferences or requirements

#### 3. `compare-flights`
Compare multiple flight options side by side to help you make the best choice.

**Parameters:**
- `flightOptions` (required): JSON string of flight options to compare
- `criteria` (optional): Comparison criteria (price, duration, stops, etc.)

#### 4. `travel-planning`
Get comprehensive travel planning assistance including flight recommendations, timing, and tips.

**Parameters:**
- `destination` (required): Travel destination
- `origin` (optional): Origin city or airport
- `travelDates` (optional): Preferred travel dates or date range
- `tripDuration` (optional): Length of stay
- `travelers` (optional): Number and type of travelers
- `interests` (optional): Travel interests and activities
- `budget` (optional): Budget range for the trip

### 🎯 **Quick Action Prompts (No Parameters)**

#### 5. `sort-by-price`
Get instructions to sort flight results by price with airline and timing details.

#### 6. `find-cheapest`
Get instructions to find the most affordable flight options.

#### 7. `non-stop-preferred`
Get instructions to prioritize non-stop flights.

#### 8. `business-class-search`
Get instructions to search for business class flights.

#### 9. `flexible-dates`
Get instructions to search with flexible travel dates.

#### 10. `morning-flights`
Get instructions to search for morning departure flights.

#### 11. `weekend-trip`
Get instructions for planning weekend getaways.

#### 12. `family-travel`
Get instructions for family-friendly flight options.

#### 13. `last-minute-travel`
Get instructions for urgent or last-minute travel.

## 🚀 **MCP Server Usage Examples**

### Using Tools (Direct API Calls)
```typescript
// Search for flights
await mcpClient.callTool('search_flights', {
  origin: 'LAX',
  destination: 'JFK',
  departureDate: '2024-03-15',
  adults: 1
});

// Get detailed flight offers
await mcpClient.callTool('get_flight_offers', {
  offerId: 'flight-offer-123'
});
```

### Using Prompts (LLM-Assisted)
```typescript
// Get formatted flight results
await mcpClient.getPrompt('format-flight-results', {
  flightData: JSON.stringify(flightResults),
  includeDetails: 'true'
});

// Get travel planning assistance
await mcpClient.getPrompt('travel-planning', {
  destination: 'Paris',
  origin: 'New York',
  travelDates: 'March 2024',
  budget: '$2000'
});

// Quick action prompts (no parameters)
await mcpClient.getPrompt('find-cheapest');
await mcpClient.getPrompt('business-class-search');
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mcp-amadeusflights
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env file with your Amadeus API credentials
touch .env
```

4. Get Amadeus API credentials:
   - Visit [Amadeus for Developers](https://developers.amadeus.com/)
   - Create a free account
   - Create a new app to get your API key and secret
   - Use the **test environment** credentials for development

5. Configure your Amadeus API credentials in `.env`:
```env
AMADEUS_CLIENT_ID=your_amadeus_client_id_here
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret_here
AMADEUS_ENVIRONMENT=test
DEFAULT_CURRENCY=USD
```

## Usage

### Development

#### Stdio Transport (Default)
```bash
npm run dev
```

#### HTTP Transport
```bash
npm run dev:http
```

### Production

#### Stdio Transport (Default)
```bash
npm run build
npm start
```

#### HTTP Transport
```bash
npm run build
npm run start:http
```

### Testing
```bash
npm test
npm run test:watch
npm run test:coverage
```

```

## Transport Options

This MCP server supports two transport methods:

### 1. Stdio Transport (Default)
- **Use Case**: Local CLI tools, desktop applications
- **Session Management**: Single session, stateless
- **Client Types**: Claude Desktop, Cline, other MCP clients
- **Deployment**: Local process execution

### 2. HTTP Transport (NEW)
- **Use Case**: Remote servers, web applications, browser-based clients
- **Session Management**: Multiple sessions, stateful with session IDs
- **Client Types**: Web browsers, remote MCP clients, web applications
- **Deployment**: Network service on configurable port

For detailed HTTP transport documentation, see [HTTP_TRANSPORT_README.md](./HTTP_TRANSPORT_README.md).

## MCP Server Configuration

To use this server with MCP-compatible clients (like Claude Desktop, Cline, etc.), you need to configure it in your MCP client settings.

### For Claude Desktop

Add the following to your Claude Desktop configuration file:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux**: `~/.config/claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "amadeus-flights": {
      "command": "node",
      "args": ["dist/server/index.js"],
      "cwd": "/path/to/your/mcp-amadeusflights",
      "env": {
        "AMADEUS_CLIENT_ID": "your_amadeus_client_id_here",
        "AMADEUS_CLIENT_SECRET": "your_amadeus_client_secret_here",
        "AMADEUS_ENVIRONMENT": "test",
        "DEFAULT_CURRENCY": "USD"
      }
    }
  }
}
```

### For HTTP Transport

To use the HTTP transport, start the server and connect via HTTP:

1. **Start the HTTP server**:
   ```bash
   npm run dev:http
   # or for production
   npm run build && npm run start:http
   ```

2. **Configure your HTTP client** to connect to `http://localhost:3000/mcp`

3. **Handle session management**:
   - Initialize session with POST request
   - Use `Mcp-Session-Id` header for subsequent requests
   - Sessions are automatically cleaned up when closed

### For Other MCP Clients

The server can be used with any MCP-compatible client. Make sure to:

1. **Build the project first**:
   ```bash
   npm run build
   ```

2. **Set the correct path** in your MCP client configuration to point to the built server

3. **Configure environment variables** either in the MCP client config or in a `.env` file

### MCP Server Features

- **Standard MCP Protocol**: Compatible with all MCP clients
- **Tool Discovery**: Automatically exposes all available flight search tools
- **Error Handling**: Comprehensive error reporting and logging
- **Rate Limiting**: Built-in protection against API abuse
- **Type Safety**: Full TypeScript support with proper type definitions

## Configuration

The server can be configured using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `AMADEUS_CLIENT_ID` | Amadeus API client ID | Required |
| `AMADEUS_CLIENT_SECRET` | Amadeus API client secret | Required |
| `AMADEUS_ENVIRONMENT` | API environment (test/production) | test |
| `MCP_SERVER_NAME` | MCP server name | amadeus-flights-server |
| `MCP_SERVER_VERSION` | Server version | 1.0.0 |
| `LOG_LEVEL` | Logging level | info |
| `RATE_LIMIT_REQUESTS_PER_MINUTE` | Rate limit per minute | 60 |
| `RATE_LIMIT_BURST` | Rate limit burst | 10 |
| `HTTP_PORT` | HTTP server port (HTTP transport only) | 3000 |
| `CORS_ORIGIN` | CORS origin for browser clients (HTTP transport only) | * |

## API Integration

This MCP server integrates with the Amadeus Self-Service APIs:

- **Flight Offers Search API**: For searching flight offers
- **Flight Offers API**: For getting specific flight offer details
- **Airport & City Search API**: For searching airports
- **Airline Code Lookup API**: For airline information
- **Flight Inspiration API**: For destination inspiration
- **Flight Cheapest Date Search API**: For finding cheapest dates

## Error Handling

The server includes comprehensive error handling:

- **Validation Errors**: Input parameter validation with detailed error messages
- **API Errors**: Amadeus API error handling with retry logic
- **Network Errors**: Connection and timeout error handling
- **Rate Limiting**: Built-in rate limiting and retry mechanisms

## Development

### Project Structure
```
src/
├── server/
│   ├── index.ts              # Main server entry point
│   ├── mcp-server.ts         # MCP server implementation
│   └── tools/                # Tool implementations
│       ├── flight-search.ts
│       └── index.ts
├── services/
│   ├── amadeus-client.ts     # Amadeus SDK wrapper
│   └── validation.ts         # Input validation schemas
├── types/
│   ├── amadeus.ts           # Amadeus API types
│   └── mcp.ts               # MCP-specific types
└── utils/
    ├── error-handler.ts     # Error handling utilities
    └── formatters.ts        # Response formatters
```

### Adding New Tools

1. Create a new tool class in `src/server/tools/`
2. Implement the tool logic with proper validation
3. Add the tool to the MCP server's tool list
4. Add appropriate error handling and logging
5. Write tests for the new tool

### Testing

The project includes comprehensive testing:

- **Unit Tests**: Individual component testing
- **Integration Tests**: End-to-end testing
- **Mock Data**: Test fixtures for Amadeus API responses

## License

ISC

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## Troubleshooting

### Common Issues

**"Missing required environment variables" error:**
- Ensure your `.env` file exists and contains valid Amadeus API credentials
- Check that the `.env` file is in the project root directory
- Verify the environment variable names match exactly (case-sensitive)

**"Amadeus API Error" messages:**
- Verify your API credentials are correct
- Check if you're using test environment credentials (not production)
- Ensure your Amadeus account has the necessary API access

**MCP client connection issues:**
- Make sure you've built the project with `npm run build`
- Verify the path in your MCP client configuration is correct
- Check that the server starts successfully with `npm run dev`

**Flight search returns limited results:**
- This is normal behavior in the test environment
- Try different routes or dates for more variety
- The server limits results to 10 flights by default to prevent context flooding

### Debug Mode

Run the server in debug mode to see detailed logs:
```bash
LOG_LEVEL=debug npm run dev
```

Test the Amadeus API connection directly:
```bash
node debug-flight-search.js
```

## Support

For issues and questions:

1. Check the [Issues](https://github.com/pratikjadhav2726/mcp-amadeusflights/issues) page
2. Create a new issue with detailed information
3. Include error logs and configuration details

## Changelog

### v1.0.0
- Initial release
- Basic flight search functionality
- Airport and airline lookup
- Multi-city flight search
- Flight inspiration and cheapest dates
- Comprehensive error handling
- Input validation and type safety