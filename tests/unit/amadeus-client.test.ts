import { AmadeusClient } from '../../src/services/amadeus-client.js';
import { ServerConfig } from '../../src/types/mcp.js';

// Mock the Amadeus SDK
jest.mock('amadeus', () => {
  return jest.fn().mockImplementation(() => ({
    shopping: {
      flightOffersSearch: {
        get: jest.fn().mockResolvedValue({
          result: {
            data: [],
            meta: { count: 0, links: { self: 'test' } }
          }
        })
      },
      flightOffers: {
        get: jest.fn().mockResolvedValue({
          result: {
            data: [],
            meta: { count: 0, links: { self: 'test' } }
          }
        })
      }
    },
    referenceData: {
      locations: {
        get: jest.fn().mockResolvedValue({
          result: {
            data: [],
            meta: { count: 0, links: { self: 'test' } }
          }
        })
      },
      airlines: {
        get: jest.fn().mockResolvedValue({
          result: {
            data: [],
            meta: { count: 0, links: { self: 'test' } }
          }
        })
      }
    }
  }));
});

describe('AmadeusClient', () => {
  let client: AmadeusClient;
  let config: ServerConfig;

  beforeEach(() => {
    config = {
      amadeus: {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        environment: 'test'
      },
      mcp: {
        name: 'test-server',
        version: '1.0.0',
        description: 'Test server'
      },
      logging: {
        level: 'info'
      },
      rateLimit: {
        requestsPerMinute: 60,
        burst: 10
      }
    };
    client = new AmadeusClient(config);
  });

  describe('searchFlights', () => {
    it('should search for flights with valid parameters', async () => {
      const params = {
        originLocationCode: 'LHR',
        destinationLocationCode: 'JFK',
        departureDate: '2024-06-01',
        adults: 1
      };

      const result = await client.searchFlights(params);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.meta).toBeDefined();
    });

    it('should handle API errors gracefully', async () => {
      const mockAmadeus = require('amadeus');
      const mockClient = new mockAmadeus();
      mockClient.shopping.flightOffersSearch.get.mockRejectedValueOnce(
        new Error('API Error')
      );

      const params = {
        originLocationCode: 'LHR',
        destinationLocationCode: 'JFK',
        departureDate: '2024-06-01',
        adults: 1
      };

      await expect(client.searchFlights(params)).rejects.toThrow();
    });
  });

  describe('searchAirports', () => {
    it('should search for airports with valid parameters', async () => {
      const params = {
        keyword: 'London',
        countryCode: 'GB',
        max: 10
      };

      const result = await client.searchAirports(params);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.meta).toBeDefined();
    });
  });

  describe('testConnection', () => {
    it('should test API connection successfully', async () => {
      const isConnected = await client.testConnection();
      expect(isConnected).toBe(true);
    });
  });
});
