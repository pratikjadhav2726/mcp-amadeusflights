import { 
  validateParams, 
  searchFlightsSchema,
  searchAirportsSchema,
  getAirlineCodesSchema
} from '../../src/services/validation.js';

describe('Validation', () => {
  describe('searchFlightsSchema', () => {
    it('should validate correct flight search parameters', () => {
      const validParams = {
        origin: 'LHR',
        destination: 'JFK',
        departureDate: '2024-06-01',
        adults: 2,
        children: 1,
        returnDate: '2024-06-15',
        travelClass: 'ECONOMY',
        nonStop: false,
        maxPrice: 1000,
        currencyCode: 'USD',
        max: 10
      };

      expect(() => validateParams(searchFlightsSchema, validParams)).not.toThrow();
    });

    it('should reject invalid airport codes', () => {
      const invalidParams = {
        origin: 'LONDON', // Too long
        destination: 'JFK',
        departureDate: '2024-06-01',
        adults: 1
      };

      expect(() => validateParams(searchFlightsSchema, invalidParams)).toThrow();
    });

    it('should reject invalid date format', () => {
      const invalidParams = {
        origin: 'LHR',
        destination: 'JFK',
        departureDate: '06-01-2024', // Wrong format
        adults: 1
      };

      expect(() => validateParams(searchFlightsSchema, invalidParams)).toThrow();
    });

    it('should reject invalid passenger counts', () => {
      const invalidParams = {
        origin: 'LHR',
        destination: 'JFK',
        departureDate: '2024-06-01',
        adults: 0 // Too few adults
      };

      expect(() => validateParams(searchFlightsSchema, invalidParams)).toThrow();
    });

    it('should reject return date before departure date', () => {
      const invalidParams = {
        origin: 'LHR',
        destination: 'JFK',
        departureDate: '2024-06-15',
        returnDate: '2024-06-01', // Before departure
        adults: 1
      };

      expect(() => validateParams(searchFlightsSchema, invalidParams)).toThrow();
    });

    it('should reject children without adults', () => {
      const invalidParams = {
        origin: 'LHR',
        destination: 'JFK',
        departureDate: '2024-06-01',
        adults: 0,
        children: 1
      };

      expect(() => validateParams(searchFlightsSchema, invalidParams)).toThrow();
    });
  });

  describe('searchAirportsSchema', () => {
    it('should validate correct airport search parameters', () => {
      const validParams = {
        keyword: 'London',
        countryCode: 'GB',
        max: 10
      };

      expect(() => validateParams(searchAirportsSchema, validParams)).not.toThrow();
    });

    it('should reject empty keyword', () => {
      const invalidParams = {
        keyword: '',
        countryCode: 'GB'
      };

      expect(() => validateParams(searchAirportsSchema, invalidParams)).toThrow();
    });

    it('should reject invalid country code length', () => {
      const invalidParams = {
        keyword: 'London',
        countryCode: 'GBR' // Too long
      };

      expect(() => validateParams(searchAirportsSchema, invalidParams)).toThrow();
    });
  });

  describe('getAirlineCodesSchema', () => {
    it('should validate correct airline search parameters', () => {
      const validParams = {
        airlineCodes: 'BA,AA,DL',
        max: 10
      };

      expect(() => validateParams(getAirlineCodesSchema, validParams)).not.toThrow();
    });

    it('should validate parameters without airline codes', () => {
      const validParams = {
        max: 10
      };

      expect(() => validateParams(getAirlineCodesSchema, validParams)).not.toThrow();
    });
  });
});
