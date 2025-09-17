# MCP Amadeus Flights Server

A Model Context Protocol (MCP) server that provides flight search capabilities to Large Language Models (LLMs) using the Amadeus Node.js SDK.

## Features

- **Flight Search**: Search for flights between airports with flexible parameters
- **Airport Lookup**: Find airports by name, city, or IATA code
- **Airline Information**: Get detailed airline information
- **Multi-City Flights**: Search for complex multi-city flight combinations
- **Flight Inspiration**: Discover flight destinations based on budget and preferences
- **Cheapest Dates**: Find the most affordable travel dates for specific routes
- **Comprehensive Error Handling**: Robust error management with retry logic
- **Input Validation**: Strong type safety and parameter validation

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

### 7. `search_flight_cheapest_dates`
Find cheapest dates for a specific route.

**Parameters:**
- `origin` (required): Origin airport IATA code
- `destination` (required): Destination airport IATA code
- `departureDate` (required): Departure date in YYYY-MM-DD format
- `returnDate` (optional): Return date for round-trip flights
- `oneWay` (optional): One-way trip only
- `nonStop` (optional): Non-stop flights only
- `maxPrice` (optional): Maximum price filter

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
cp .env.example .env
```

4. Configure your Amadeus API credentials in `.env`:
```env
AMADEUS_CLIENT_ID=your_amadeus_client_id_here
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret_here
AMADEUS_ENVIRONMENT=test
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Testing
```bash
npm test
npm run test:watch
npm run test:coverage
```

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