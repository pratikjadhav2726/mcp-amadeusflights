// Prompt-specific types for MCP server

export interface PromptMessage {
  role: 'user' | 'assistant';
  content: {
    type: 'text';
    text: string;
  };
  [key: string]: unknown;
}

export interface PromptResponse {
  messages: PromptMessage[];
  [key: string]: unknown;
}

// Format Flight Results Prompt
export interface FormatFlightResultsArgs {
  flightData: string;
  includeDetails?: string;
}

// Flight Search Assistance Prompt
export interface FlightSearchAssistanceArgs {
  origin?: string;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  passengers?: string;
  travelClass?: string;
  budget?: string;
  preferences?: string;
}

// Compare Flights Prompt
export interface CompareFlightsArgs {
  flightOptions: string;
  criteria?: string;
}

// Travel Planning Prompt
export interface TravelPlanningArgs {
  destination: string;
  origin?: string;
  travelDates?: string;
  tripDuration?: string;
  travelers?: string;
  interests?: string;
  budget?: string;
}

// Prompt definitions for registration
export interface PromptDefinition {
  title: string;
  description: string;
  argsSchema?: Record<string, any>;
}

// Available prompts
export const PROMPT_DEFINITIONS: Record<string, PromptDefinition> = {
  'format-flight-results': {
    title: 'Format Flight Results',
    description: 'Format flight search results with airline information, departure/arrival times, and layover details in a user-friendly format'
  },
  'flight-search-assistance': {
    title: 'Flight Search Assistance',
    description: 'Get help with flight search parameters and find the best flights for your travel needs'
  },
  'compare-flights': {
    title: 'Compare Flight Options',
    description: 'Compare multiple flight options side by side to help you make the best choice'
  },
  'travel-planning': {
    title: 'Travel Planning Assistant',
    description: 'Get comprehensive travel planning assistance including flight recommendations, timing, and tips'
  }
};
