import { MCPError, ValidationError, AmadeusAPIError, NetworkError } from '../types/mcp.js';

export class ErrorHandler {
  /**
   * Create a validation error
   */
  static createValidationError(field: string, message: string, value?: any): ValidationError {
    return {
      code: 'VALIDATION_ERROR',
      message,
      field,
      value
    };
  }

  /**
   * Create an Amadeus API error
   */
  static createAmadeusAPIError(message: string, statusCode: number, amadeusErrorCode?: string): AmadeusAPIError {
    return {
      code: 'AMADEUS_API_ERROR',
      message,
      statusCode,
      amadeusErrorCode
    };
  }

  /**
   * Create a network error
   */
  static createNetworkError(originalError: Error): NetworkError {
    return {
      code: 'NETWORK_ERROR',
      message: `Network error: ${originalError.message}`,
      originalError
    };
  }

  /**
   * Create a generic MCP error
   */
  static createMCPError(code: string, message: string, details?: any): MCPError {
    return {
      code,
      message,
      details
    };
  }

  /**
   * Handle and format errors for MCP response
   */
  static handleError(error: any): MCPError {
    if (error.code && error.message) {
      // Already a formatted MCP error
      return error;
    }

    if (error.name === 'ZodError') {
      // Validation error from Zod
      return this.createValidationError(
        'validation',
        'Invalid input parameters',
        error.errors
      );
    }

    if (error.message?.includes('Amadeus API Error')) {
      // Amadeus API error
      const statusMatch = error.message.match(/\((\d+)\)/);
      const statusCode = statusMatch ? parseInt(statusMatch[1]) : 500;
      return this.createAmadeusAPIError(error.message, statusCode);
    }

    if (error.message?.includes('Network Error')) {
      // Network error
      return this.createNetworkError(error);
    }

    // Generic error
    return this.createMCPError(
      'UNKNOWN_ERROR',
      error.message || 'An unknown error occurred',
      error
    );
  }

  /**
   * Log error with appropriate level
   */
  static logError(error: MCPError, context?: string): void {
    const logMessage = context ? `[${context}] ${error.message}` : error.message;
    
    switch (error.code) {
      case 'VALIDATION_ERROR':
        console.warn(`Validation Error: ${logMessage}`, error.details);
        break;
      case 'AMADEUS_API_ERROR':
        console.error(`Amadeus API Error: ${logMessage}`, error.details);
        break;
      case 'NETWORK_ERROR':
        console.error(`Network Error: ${logMessage}`, error.details);
        break;
      default:
        console.error(`Error: ${logMessage}`, error.details);
    }
  }

  /**
   * Check if error is retryable
   */
  static isRetryableError(error: MCPError): boolean {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return true;
      case 'AMADEUS_API_ERROR':
        // Retry on 5xx errors, rate limiting, and timeouts
        const statusCode = (error as AmadeusAPIError).statusCode;
        return statusCode >= 500 || statusCode === 429 || statusCode === 408;
      default:
        return false;
    }
  }

  /**
   * Get retry delay based on error type
   */
  static getRetryDelay(error: MCPError, attempt: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    
    // Cap at max delay
    return Math.min(exponentialDelay, maxDelay);
  }
}

/**
 * Retry function with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  context?: string
): Promise<T> {
  let lastError: MCPError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      const mcpError = ErrorHandler.handleError(error);
      lastError = mcpError;

      ErrorHandler.logError(mcpError, context);

      if (attempt === maxAttempts || !ErrorHandler.isRetryableError(mcpError)) {
        throw mcpError;
      }

      const delay = ErrorHandler.getRetryDelay(mcpError, attempt);
      console.error(`Retrying in ${delay}ms... (attempt ${attempt}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
