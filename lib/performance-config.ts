/**
 * Performance Optimization Configuration
 * These settings help prevent timeout errors in Next.js 15.5.0
 */

// API Route Timeouts
export const API_TIMEOUTS = {
  SHORT: 8000,      // 8 seconds - For simple queries (GET addresses, products)
  MEDIUM: 10000,    // 10 seconds - For mutations (POST, PUT, DELETE)
  LONG: 15000,      // 15 seconds - For complex operations (order creation)
  FETCH: 8000,      // 8 seconds - Client-side fetch timeout
};

// MongoDB Query Optimization
export const DB_OPTIONS = {
  // Use lean() for read-only queries to improve performance
  useLean: true,
  
  // Limit results for list queries
  defaultLimit: 50,
  maxLimit: 100,
  
  // Projection fields to reduce data transfer
  userFields: 'fullName email profileImage',
  productFields: 'productName unit price productImage',
  addressFields: 'label fullName phone street city province zipCode isDefault type',
};

// Cache durations (in seconds)
export const CACHE_DURATION = {
  STATIC: 3600,      // 1 hour - For rarely changing data
  DYNAMIC: 300,      // 5 minutes - For frequently changing data
  USER: 600,         // 10 minutes - For user data
  PRODUCT: 900,      // 15 minutes - For product listings
};

// Retry configuration
export const RETRY_CONFIG = {
  maxRetries: 2,
  retryDelay: 1000, // 1 second between retries
  retryableErrors: ['AbortError', 'NetworkError', 'TimeoutError'],
};

// Request debouncing
export const DEBOUNCE_DELAYS = {
  SEARCH: 500,       // 500ms - Search input debounce
  AUTOSAVE: 2000,    // 2s - Auto-save debounce
  FILTER: 300,       // 300ms - Filter changes debounce
};

export default {
  API_TIMEOUTS,
  DB_OPTIONS,
  CACHE_DURATION,
  RETRY_CONFIG,
  DEBOUNCE_DELAYS,
};
