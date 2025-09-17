import { FlightOffer, Airport, Airline, AmadeusResponse } from '../types/amadeus.js';
import { MCPToolResult } from '../types/mcp.js';

export class ResponseFormatter {
  /**
   * Get the default currency from environment variable
   */
  private static getDefaultCurrency(): string {
    return process.env.DEFAULT_CURRENCY || 'USD';
  }

  /**
   * Format price with configured currency
   */
  private static formatPrice(price: { currency: string; total: string }): string {
    const defaultCurrency = this.getDefaultCurrency();
    return `${defaultCurrency} ${price.total}`;
  }

  /**
   * Format flight offers response for MCP
   */
  static formatFlightOffers(response: AmadeusResponse<FlightOffer>): MCPToolResult {
    const offers = response.data.map(offer => {
      const outboundItinerary = offer.itineraries[0];
      const returnItinerary = offer.itineraries[1]; // For round-trip flights
      
      // Outbound flight details
      const outboundFirstSegment = outboundItinerary?.segments[0];
      const outboundLastSegment = outboundItinerary?.segments[outboundItinerary.segments.length - 1];
      
      // Return flight details (if exists)
      const returnFirstSegment = returnItinerary?.segments[0];
      const returnLastSegment = returnItinerary?.segments[returnItinerary.segments.length - 1];
      
      // Determine if this is actually a one-way flight (no return itinerary)
      const isOneWay = offer.oneWay || !returnItinerary;
      
      const result: any = {
        id: offer.id,
        price: this.formatPrice(offer.price),
        oneWay: isOneWay,
        seats: offer.numberOfBookableSeats,
        tripType: isOneWay ? 'one-way' : 'round-trip'
      };
      
      // Add outbound flight info
      if (outboundItinerary) {
        result.outbound = {
          duration: outboundItinerary.duration,
          route: outboundFirstSegment && outboundLastSegment ? 
            `${outboundFirstSegment.departure.iataCode} → ${outboundLastSegment.arrival.iataCode}` : 'N/A',
          departure: outboundFirstSegment?.departure.at,
          arrival: outboundLastSegment?.arrival.at,
          airline: outboundFirstSegment ? `${outboundFirstSegment.carrierCode}${outboundFirstSegment.number}` : 'N/A',
          stops: outboundFirstSegment?.numberOfStops || 0
        };
      }
      
      // Add return flight info (only for round-trip flights)
      if (returnItinerary && !isOneWay) {
        result.return = {
          duration: returnItinerary.duration,
          route: returnFirstSegment && returnLastSegment ? 
            `${returnFirstSegment.departure.iataCode} → ${returnLastSegment.arrival.iataCode}` : 'N/A',
          departure: returnFirstSegment?.departure.at,
          arrival: returnLastSegment?.arrival.at,
          airline: returnFirstSegment ? `${returnFirstSegment.carrierCode}${returnFirstSegment.number}` : 'N/A',
          stops: returnFirstSegment?.numberOfStops || 0
        };
      }
      
      return result;
    });

    // Sort by price (cheapest first) and limit results to prevent context flooding
    const sortedOffers = offers.sort((a, b) => {
      const priceA = parseFloat(a.price.replace(/[^\d.]/g, ''));
      const priceB = parseFloat(b.price.replace(/[^\d.]/g, ''));
      return priceA - priceB;
    });
    
    const limitedOffers = sortedOffers.slice(0, 10);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          offers: limitedOffers,
          meta: {
            count: response.meta.count,
            totalOffers: offers.length,
            showing: limitedOffers.length
          }
        }, null, 2)
      }]
    };
  }

  /**
   * Format airports response for MCP
   */
  static formatAirports(response: AmadeusResponse<Airport>): MCPToolResult {
    const airports = response.data.map(airport => ({
      code: airport.iataCode,
      name: airport.name,
      city: airport.address?.cityName,
      country: airport.address?.countryName,
      location: airport.address?.cityName && airport.address?.countryName ? 
        `${airport.address.cityName}, ${airport.address.countryName}` : 'N/A'
    }));

    // Limit to top 10 airports to prevent context flooding
    const limitedAirports = airports.slice(0, 10);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          airports: limitedAirports,
          meta: {
            count: response.meta.count,
            totalAirports: airports.length,
            showing: limitedAirports.length
          }
        }, null, 2)
      }]
    };
  }

  /**
   * Format airlines response for MCP
   */
  static formatAirlines(response: AmadeusResponse<Airline>): MCPToolResult {
    const airlines = response.data.map(airline => ({
      code: airline.iataCode,
      name: airline.commonName || airline.businessName
    }));

    // Limit to top 10 airlines to prevent context flooding
    const limitedAirlines = airlines.slice(0, 10);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          airlines: limitedAirlines,
          meta: {
            count: response.meta.count,
            totalAirlines: airlines.length,
            showing: limitedAirlines.length
          }
        }, null, 2)
      }]
    };
  }


  /**
   * Format flight cheapest dates response for MCP
   */
  static formatFlightCheapestDates(response: AmadeusResponse<any>): MCPToolResult {
    const defaultCurrency = this.getDefaultCurrency();
    const dates = response.data.map((date: any) => ({
      departureDate: date.departureDate,
      returnDate: date.returnDate,
      price: date.price ? `${defaultCurrency} ${date.price.replace(/[^\d.]/g, '')}` : 'N/A'
    }));

    // Sort by price (cheapest first) and limit to top 10
    const sortedDates = dates.sort((a, b) => {
      const priceA = parseFloat(a.price?.replace(/[^\d.]/g, '') || '0');
      const priceB = parseFloat(b.price?.replace(/[^\d.]/g, '') || '0');
      return priceA - priceB;
    }).slice(0, 10);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          dates: sortedDates,
          meta: {
            count: response.meta.count,
            totalDates: dates.length,
            showing: sortedDates.length
          }
        }, null, 2)
      }]
    };
  }

  /**
   * Format error response for MCP
   */
  static formatError(error: any): MCPToolResult {
    return {
      content: [{
        type: 'text',
        text: `Error: ${error.message || 'An unknown error occurred'}`
      }]
    };
  }

  /**
   * Format success message for MCP
   */
  static formatSuccess(message: string, data?: any): MCPToolResult {
    const content: any[] = [{
      type: 'text',
      text: message
    }];

    if (data) {
      content.push({
        type: 'text',
        text: JSON.stringify(data, null, 2)
      });
    }

    return { content };
  }

  /**
   * Format flight offer summary for quick overview
   */
  static formatFlightOfferSummary(offer: FlightOffer): string {
    const firstItinerary = offer.itineraries[0];
    const firstSegment = firstItinerary?.segments[0];
    const lastSegment = firstItinerary?.segments[firstItinerary.segments.length - 1];

    if (!firstSegment || !lastSegment) {
      return 'Invalid flight offer';
    }

    const departure = firstSegment.departure;
    const arrival = lastSegment.arrival;
    const price = offer.price;

    return `Flight ${firstSegment.carrierCode}${firstSegment.number}: ${departure.iataCode} → ${arrival.iataCode} | ${price.currency} ${price.total} | ${firstItinerary.duration}`;
  }

  /**
   * Format airport summary for quick overview
   */
  static formatAirportSummary(airport: Airport): string {
    return `${airport.iataCode} - ${airport.name} (${airport.address?.cityName}, ${airport.address?.countryName})`;
  }

  /**
   * Format airline summary for quick overview
   */
  static formatAirlineSummary(airline: Airline): string {
    return `${airline.iataCode} - ${airline.commonName || airline.businessName}`;
  }
}
