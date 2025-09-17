# 🚀 MCP Amadeus Flights Server v1.0.0

**Initial Release - Complete Flight Search Solution for LLMs**

## ✨ What's New

This is the first stable release of the MCP Amadeus Flights Server, providing comprehensive flight search capabilities to Large Language Models through the Model Context Protocol.

## 🎯 Key Features

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

## 🔗 MCP Client Integration

Compatible with all MCP clients including:
- Claude Desktop
- Cline
- Any MCP-compatible AI assistant

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

---

**Full Changelog**: This is the initial release with all core features implemented.
