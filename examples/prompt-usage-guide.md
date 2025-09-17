# 🎯 MCP Amadeus Flights Server - Prompt Usage Guide

This guide provides comprehensive documentation for using the registered prompts in the MCP Amadeus Flights Server v1.1.0.

## 📋 Overview

The server includes 13 registered prompts that provide intelligent assistance for different travel scenarios. These prompts are designed to work seamlessly with MCP-compatible AI assistants like Claude Desktop, Cline, and others.

## 🚀 Quick Start

### Basic Prompt Usage
```typescript
// Get a prompt (no parameters)
const response = await mcpClient.getPrompt('find-cheapest');

// Get a prompt with parameters
const response = await mcpClient.getPrompt('travel-planning', {
  destination: 'Paris',
  origin: 'New York',
  budget: '$2000'
});
```

## 📋 Advanced Prompts (with Parameters)

### 1. `format-flight-results`

**Purpose**: Format flight search results with airline information, departure/arrival times, and layover details in a user-friendly format.

**Parameters**:
- `flightData` (required): Flight search results data to format (JSON string)
- `includeDetails` (optional): Whether to include detailed information like aircraft type and terminal info (true/false)

**Example Usage**:
```typescript
const response = await mcpClient.getPrompt('format-flight-results', {
  flightData: JSON.stringify({
    data: [
      {
        price: { currency: 'USD', total: '450.00' },
        itineraries: [{
          duration: 'PT5H30M',
          segments: [{
            carrierCode: 'AA',
            number: '123',
            departure: { iataCode: 'LAX', at: '2024-03-15T08:00:00' },
            arrival: { iataCode: 'JFK', at: '2024-03-15T16:30:00' }
          }]
        }]
      }
    ]
  }),
  includeDetails: 'true'
});
```

**Expected Output**: Formatted flight results with airline names, times, layover information, and pricing details.

### 2. `flight-search-assistance`

**Purpose**: Get help with flight search parameters and find the best flights for your travel needs.

**Parameters**:
- `origin` (optional): Origin city or airport code
- `destination` (optional): Destination city or airport code
- `departureDate` (optional): Preferred departure date (YYYY-MM-DD)
- `returnDate` (optional): Preferred return date for round trip (YYYY-MM-DD)
- `passengers` (optional): Number of passengers
- `travelClass` (optional): Preferred travel class (ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST)
- `budget` (optional): Maximum budget for the trip
- `preferences` (optional): Any specific preferences or requirements

**Example Usage**:
```typescript
const response = await mcpClient.getPrompt('flight-search-assistance', {
  origin: 'Los Angeles',
  destination: 'New York',
  departureDate: '2024-03-15',
  passengers: '2',
  travelClass: 'ECONOMY',
  budget: '$1000',
  preferences: 'Non-stop flights preferred, morning departures'
});
```

**Expected Output**: Personalized flight search guidance with recommendations and next steps.

### 3. `compare-flights`

**Purpose**: Compare multiple flight options side by side to help you make the best choice.

**Parameters**:
- `flightOptions` (required): JSON string of flight options to compare
- `criteria` (optional): Comparison criteria (price, duration, stops, etc.)

**Example Usage**:
```typescript
const response = await mcpClient.getPrompt('compare-flights', {
  flightOptions: JSON.stringify([
    {
      price: { currency: 'USD', total: '450.00' },
      itineraries: [{ duration: 'PT5H30M', segments: [{ numberOfStops: 0 }] }]
    },
    {
      price: { currency: 'USD', total: '380.00' },
      itineraries: [{ duration: 'PT7H15M', segments: [{ numberOfStops: 1 }] }]
    }
  ]),
  criteria: 'price, duration, stops'
});
```

**Expected Output**: Side-by-side comparison table with recommendations based on specified criteria.

### 4. `travel-planning`

**Purpose**: Get comprehensive travel planning assistance including flight recommendations, timing, and tips.

**Parameters**:
- `destination` (required): Travel destination
- `origin` (optional): Origin city or airport
- `travelDates` (optional): Preferred travel dates or date range
- `tripDuration` (optional): Length of stay
- `travelers` (optional): Number and type of travelers
- `interests` (optional): Travel interests and activities
- `budget` (optional): Budget range for the trip

**Example Usage**:
```typescript
const response = await mcpClient.getPrompt('travel-planning', {
  destination: 'Paris',
  origin: 'New York',
  travelDates: 'March 2024',
  tripDuration: '1 week',
  travelers: '2 adults',
  interests: 'art, food, history',
  budget: '$3000'
});
```

**Expected Output**: Comprehensive travel planning guide with flight recommendations, timing advice, and travel tips.

## 🎯 Quick Action Prompts (No Parameters)

These prompts provide immediate instructions to the AI assistant without requiring parameters:

### 5. `sort-by-price`
**Purpose**: Get instructions to sort flight results by price with airline and timing details.

### 6. `find-cheapest`
**Purpose**: Get instructions to find the most affordable flight options.

### 7. `non-stop-preferred`
**Purpose**: Get instructions to prioritize non-stop flights.

### 8. `business-class-search`
**Purpose**: Get instructions to search for business class flights.

### 9. `flexible-dates`
**Purpose**: Get instructions to search with flexible travel dates.

### 10. `morning-flights`
**Purpose**: Get instructions to search for morning departure flights.

### 11. `weekend-trip`
**Purpose**: Get instructions for planning weekend getaways.

### 12. `family-travel`
**Purpose**: Get instructions for family-friendly flight options.

### 13. `last-minute-travel`
**Purpose**: Get instructions for urgent or last-minute travel.

## 🔧 Integration Examples

### With Claude Desktop
```json
{
  "mcpServers": {
    "amadeus-flights": {
      "command": "node",
      "args": ["dist/server/index.js"],
      "cwd": "/path/to/mcp-amadeusflights",
      "env": {
        "AMADEUS_CLIENT_ID": "your_client_id",
        "AMADEUS_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

### With Cline
```json
{
  "servers": [
    {
      "name": "amadeus-flights",
      "command": "node",
      "args": ["dist/server/index.js"],
      "cwd": "/path/to/mcp-amadeusflights"
    }
  ]
}
```

## 🎯 Best Practices

### 1. **Use Appropriate Prompts**
- Use `format-flight-results` after getting flight search data
- Use `travel-planning` for comprehensive trip planning
- Use quick action prompts for specific search preferences

### 2. **Parameter Validation**
- Ensure required parameters are provided
- Use proper data types (strings for dates, numbers for passengers)
- Validate JSON strings before passing to prompts

### 3. **Error Handling**
```typescript
try {
  const response = await mcpClient.getPrompt('format-flight-results', {
    flightData: flightResults
  });
  // Process response
} catch (error) {
  console.error('Prompt execution failed:', error);
}
```

### 4. **Combining Tools and Prompts**
```typescript
// First, search for flights
const searchResults = await mcpClient.callTool('search_flights', {
  origin: 'LAX',
  destination: 'JFK',
  departureDate: '2024-03-15',
  adults: 1
});

// Then, format the results
const formattedResults = await mcpClient.getPrompt('format-flight-results', {
  flightData: JSON.stringify(searchResults),
  includeDetails: 'true'
});
```

## 🐛 Troubleshooting

### Common Issues

1. **"Prompt not found" error**
   - Ensure the server is running and connected
   - Check that the prompt name is spelled correctly
   - Verify the server version supports the prompt

2. **"Invalid parameters" error**
   - Check parameter names and types
   - Ensure required parameters are provided
   - Validate JSON strings are properly formatted

3. **"Server connection failed" error**
   - Verify the MCP server is running
   - Check environment variables are set correctly
   - Ensure the server is built (`npm run build`)

### Debug Commands
```bash
# Test the server connection
node debug-mcp-connection.js

# Run server in debug mode
LOG_LEVEL=debug npm run dev

# Test flight search
node debug-flight-search.js
```

## 📚 Additional Resources

- [MCP Protocol Documentation](https://modelcontextprotocol.io/)
- [Amadeus API Documentation](https://developers.amadeus.com/)
- [TypeScript MCP SDK](https://www.npmjs.com/package/@modelcontextprotocol/sdk)

## 🆘 Support

For issues and questions:
1. Check the [GitHub Issues](https://github.com/pratikjadhav2726/mcp-amadeusflights/issues)
2. Create a new issue with detailed information
3. Include error logs and configuration details
