# 🚀 MCP Amadeus Flights Server v1.1.0

**Enhanced Release - Advanced MCP Server with Registered Prompts & Improved LLM Integration**

## ✨ What's New

This release significantly enhances the MCP Amadeus Flights Server with comprehensive prompt registration, improved MCP SDK 1.18.0 integration, and advanced LLM interaction capabilities. The server now provides both powerful tools and intelligent prompts for seamless AI assistant integration.

## 🎯 Key Features

### 🚀 **NEW: Advanced MCP Server with Registered Prompts**
- **Prompt Registration**: 10+ intelligent prompts for enhanced LLM interaction
- **MCP SDK 1.18.0**: Full compatibility with latest MCP SDK features
- **Smart Prompt System**: Context-aware prompts for different travel scenarios
- **Seamless Integration**: Works with Claude Desktop, Cline, and all MCP clients

### 🔍 Flight Search Capabilities
- **Flight Search**: Search for flights between airports with flexible parameters
- **Multi-City Flights**: Search for complex multi-city flight combinations
- **Flight Inspiration**: Discover flight destinations based on budget and preferences
- **Cheapest Dates**: Find the most affordable travel dates for specific routes
- **Detailed Flight Offers**: Get comprehensive information about specific flight offers

### 🏢 Travel Data Services
- **Airport Lookup**: Find airports by name, city, or IATA code
- **Airline Information**: Get detailed airline information and codes
- **Comprehensive Search**: Support for country-specific airport searches

### 🛠️ Technical Excellence
- **MCP Protocol Compliance**: Full compatibility with Model Context Protocol
- **TypeScript Support**: Complete type safety and IntelliSense support
- **Robust Error Handling**: Comprehensive error management with retry logic
- **Input Validation**: Strong parameter validation using Zod schemas
- **Rate Limiting**: Built-in protection against API abuse
- **Extensive Testing**: Unit and integration tests with Jest

## 🛠️ Available Tools

1. **`search_flights`** - Search for flight offers between airports
2. **`get_flight_offers`** - Get detailed flight offer information
3. **`search_airports`** - Find airports by keyword or city
4. **`get_airlines`** - Retrieve airline information
5. **`search_multi_city_flights`** - Search complex multi-city combinations
6. **`search_flight_cheapest_dates`** - Find cheapest travel dates

## 🎯 **NEW: Registered Prompts for Enhanced LLM Interaction**

The server now includes 10+ intelligent prompts that provide context-aware assistance for different travel scenarios:

### 📋 **Advanced Prompts (with Parameters)**
1. **`format-flight-results`** - Format flight search results with airline info, times, and layover details
2. **`flight-search-assistance`** - Get help with flight search parameters and recommendations
3. **`compare-flights`** - Compare multiple flight options side by side
4. **`travel-planning`** - Comprehensive travel planning assistance with tips and recommendations

### 🎯 **Quick Action Prompts (No Parameters)**
5. **`sort-by-price`** - Instructions to sort flights by price with airline details
6. **`find-cheapest`** - Instructions to find the most affordable flight options
7. **`non-stop-preferred`** - Instructions to prioritize non-stop flights
8. **`business-class-search`** - Instructions to search for business class flights
9. **`flexible-dates`** - Instructions to search with flexible travel dates
10. **`morning-flights`** - Instructions to search for morning departure flights
11. **`weekend-trip`** - Instructions for planning weekend getaways
12. **`family-travel`** - Instructions for family-friendly flight options
13. **`last-minute-travel`** - Instructions for urgent or last-minute travel

### 🔧 **MCP Server Capabilities**
- **Prompt Discovery**: All prompts are automatically discoverable by MCP clients
- **Type Safety**: Full TypeScript support with proper argument validation
- **Error Handling**: Comprehensive error management for all prompt operations
- **Context Awareness**: Prompts adapt to different travel scenarios and user needs

## 🔧 Installation & Setup

```bash
# Clone the repository
git clone https://github.com/pratikjadhav2726/mcp-amadeusflights.git
cd mcp-amadeusflights

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your Amadeus API credentials to .env

# Build and run
npm run build
npm start
```

## 🔗 **Enhanced MCP Client Integration**

### 🚀 **MCP Server Usage Examples**

The server now provides both tools and prompts for comprehensive flight search assistance:

#### **Using Tools (Direct API Calls)**
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

#### **Using Prompts (LLM-Assisted)**
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

### 🎯 **Compatible MCP Clients**
- **Claude Desktop** - Full tool and prompt support
- **Cline** - Complete integration with all features
- **Any MCP-compatible AI assistant** - Universal compatibility

## 📊 API Integration

Powered by Amadeus Self-Service APIs:
- Flight Offers Search API
- Airport & City Search API
- Airline Code Lookup API
- Flight Inspiration API
- Flight Cheapest Date Search API

## 🏗️ Architecture

- **Clean Architecture**: Separation of concerns with services, types, and utilities
- **Modular Design**: Easy to extend with new tools and features
- **Error Resilience**: Comprehensive error handling and logging
- **Performance Optimized**: Efficient API usage and response formatting

## 📈 Performance

- **Rate Limiting**: 60 requests per minute with burst protection
- **Response Optimization**: Intelligent data formatting and filtering
- **Memory Efficient**: Optimized for long-running server processes

## 🧪 Testing

- **Unit Tests**: Comprehensive component testing
- **Integration Tests**: End-to-end API testing
- **Mock Data**: Realistic test fixtures
- **Coverage**: High test coverage across all modules

## 📚 Documentation

- **Comprehensive README**: Detailed setup and usage instructions
- **API Documentation**: Complete tool parameter documentation
- **Configuration Guide**: MCP client setup instructions
- **Troubleshooting**: Common issues and solutions

## 🔒 Security & Reliability

- **Environment Variables**: Secure credential management
- **Input Validation**: Protection against invalid inputs
- **Error Boundaries**: Graceful error handling
- **Logging**: Comprehensive logging for debugging

## 🌟 Use Cases

Perfect for:
- AI travel assistants
- Flight booking applications
- Travel planning tools
- LLM-powered travel agents
- Travel research applications

## 📦 Dependencies

- **@modelcontextprotocol/sdk**: ^1.18.0
- **amadeus**: ^11.0.0
- **zod**: ^3.25.76
- **dotenv**: ^17.2.2

## 🚀 Getting Started

1. Get your free Amadeus API credentials at [developers.amadeus.com](https://developers.amadeus.com/)
2. Clone and install the server
3. Configure your MCP client
4. Start searching for flights!

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/pratikjadhav2726/mcp-amadeusflights/issues)
- **Documentation**: [README.md](https://github.com/pratikjadhav2726/mcp-amadeusflights#readme)

## 📋 Changelog

### v1.1.0 (Current Release)
- **NEW**: Comprehensive prompt registration system with 10+ intelligent prompts
- **NEW**: Enhanced MCP SDK 1.18.0 integration with full prompt support
- **NEW**: Advanced prompt types including parameterized and quick-action prompts
- **NEW**: Context-aware prompts for different travel scenarios
- **NEW**: Improved LLM interaction capabilities
- **ENHANCED**: Better MCP client integration examples and documentation
- **ENHANCED**: Type safety improvements for prompt arguments
- **ENHANCED**: Error handling for prompt operations
- **ENHANCED**: Comprehensive documentation with usage examples

### v1.0.0
- Initial release
- Basic flight search functionality
- Airport and airline lookup
- Multi-city flight search
- Flight inspiration and cheapest dates
- Comprehensive error handling
- Input validation and type safety

---

**Full Changelog**: v1.1.0 adds comprehensive prompt registration and enhanced MCP server capabilities.
