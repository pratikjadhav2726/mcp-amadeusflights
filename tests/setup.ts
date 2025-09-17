// Test setup file
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Mock console methods for cleaner test output
const originalConsole = console;

beforeAll(() => {
  // Suppress console output during tests unless explicitly enabled
  if (!process.env.ENABLE_TEST_LOGS) {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  }
});

afterAll(() => {
  // Restore console methods
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

// Global test timeout
jest.setTimeout(30000);
