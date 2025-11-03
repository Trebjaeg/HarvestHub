/**
 * Lalamove Error Mapper
 * Converts Lalamove API error IDs to user-friendly messages
 * Single source of truth for error handling
 */

export interface LalamoveError {
  id?: string;
  message?: string;
  field?: string;
}

export interface LalamoveErrorResponse {
  errors?: LalamoveError[];
  message?: string;
}

/**
 * Map Lalamove API error IDs to user-friendly messages
 */
export function mapLalamoveErrorId(errorId: string): string {
  const errorMap: Record<string, string> = {
    // Market & Service Area Errors
    'ERR_INVALID_MARKET': 'Service area configuration error. Please contact support.',
    'ERR_OUT_OF_SERVICE_AREA': 'Address is outside Lalamove coverage area for the selected vehicle.',
    'ERR_UNSUPPORTED_SERVICE_TYPE': 'Selected delivery vehicle is not available for this route.',
    
    // Location Errors
    'ERR_INVALID_COORDINATES': 'Invalid location coordinates. Please select a valid address on the map.',
    'ERR_INSUFFICIENT_STOPS': 'Need pickup + at least one drop-off with pinned locations.',
    'ERR_INVALID_STOP': 'One or more delivery locations are invalid. Please check all addresses.',
    
    // Contact Errors
    'ERR_INVALID_CONTACT': 'Invalid contact information. Please check phone numbers (format: 09XX XXX XXXX).',
    'ERR_INVALID_PHONE': 'Invalid phone number format. Use Philippine mobile format: 09XX XXX XXXX.',
    
    // Schedule Errors
    'ERR_INVALID_SCHEDULE': 'Invalid delivery schedule. Please select a valid time.',
    'ERR_SCHEDULE_TOO_EARLY': 'Delivery time is too soon. Please select a later time.',
    'ERR_SCHEDULE_TOO_LATE': 'Delivery time is too far in the future. Please select an earlier time.',
    
    // Payment & Quotation Errors
    'ERR_QUOTATION_EXPIRED': 'Delivery quote has expired. Please request a new quote.',
    'ERR_QUOTATION_NOT_FOUND': 'Delivery quote not found. Please request a new quote.',
    'ERR_INSUFFICIENT_CREDIT': 'Insufficient delivery service credit. Please contact support.',
    'ERR_INVALID_QUOTATION_ID': 'Invalid delivery quote. Please request a new quote.',
    
    // Order Errors
    'ERR_ORDER_NOT_FOUND': 'Delivery order not found.',
    'ERR_ORDER_CANNOT_BE_CANCELLED': 'Order cannot be cancelled at this stage.',
    'ERR_DUPLICATE_ORDER': 'Duplicate order detected. Please check your recent orders.',
    
    // General Errors
    'ERR_SERVICE_UNAVAILABLE': 'Delivery service temporarily unavailable. Please try again later.',
    'ERR_RATE_LIMIT_EXCEEDED': 'Too many requests. Please wait a moment and try again.',
    'ERR_INVALID_REQUEST': 'Invalid request. Please check your delivery details.',
  };
  
  return errorMap[errorId] || 'Unable to process delivery request. Please try again.';
}

/**
 * Map HTTP status code to generic error message
 */
export function mapHttpStatusToError(statusCode: number): string {
  if (statusCode === 400) {
    return 'Invalid delivery request. Please check your address details.';
  }
  if (statusCode === 401 || statusCode === 403) {
    return 'Delivery service authentication failed. Please contact support.';
  }
  if (statusCode === 404) {
    return 'Delivery service endpoint not found. Please contact support.';
  }
  if (statusCode === 422) {
    return 'Invalid delivery data. Please check all address fields are complete.';
  }
  if (statusCode === 429) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  if (statusCode >= 500) {
    return 'Delivery service temporarily unavailable. Please try again in a few moments.';
  }
  
  return 'Unable to calculate delivery fee. Please try again.';
}

/**
 * Extract user-friendly message from Lalamove error response
 */
export function extractUserMessage(errorData: LalamoveErrorResponse, statusCode: number): string {
  // Check for errors array (V3 format)
  if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
    const firstError = errorData.errors[0];
    
    // Use error ID mapping if available
    if (firstError.id) {
      return mapLalamoveErrorId(firstError.id);
    }
    
    // Use error message if available
    if (firstError.message) {
      return firstError.message;
    }
  }
  
  // Check for direct message property
  if (errorData.message) {
    return errorData.message;
  }
  
  // Fall back to HTTP status mapping
  return mapHttpStatusToError(statusCode);
}

/**
 * Create formatted error object for API responses
 */
export function createErrorResponse(error: any, statusCode?: number): {
  error: string;
  message: string;
  success: false;
  statusCode: number;
  errorId?: string;
} {
  const status = statusCode || error.statusCode || 500;
  const userMessage = extractUserMessage(error.lalamoveError || {}, status);
  
  return {
    error: userMessage,
    message: userMessage,
    success: false,
    statusCode: status,
    errorId: error.lalamoveError?.errors?.[0]?.id
  };
}

/**
 * Map Lalamove status to HarvestHub internal status
 */
export function mapLalamoveStatusToInternal(lalamoveStatus: string): string {
  const statusMap: Record<string, string> = {
    // Order lifecycle
    'ASSIGNING_DRIVER': 'processing',
    'DRIVER_ASSIGNED': 'confirmed',
    'ON_GOING': 'shipped',
    'PICKED_UP': 'shipped',
    'IN_TRANSIT': 'shipped',
    'COMPLETED': 'delivered',
    'DELIVERED': 'delivered',
    
    // Cancelled states
    'CANCELED': 'cancelled',
    'CANCELLED': 'cancelled',
    'REJECTED': 'cancelled',
    'EXPIRED': 'cancelled',
    
    // Default
    'default': 'processing'
  };
  
  return statusMap[lalamoveStatus] || statusMap['default'];
}

/**
 * Check if error is retryable (5xx or timeout)
 */
export function isRetryableError(statusCode?: number, errorName?: string): boolean {
  // Retry on 5xx server errors
  if (statusCode && statusCode >= 500) {
    return true;
  }
  
  // Retry on timeout errors
  if (errorName === 'AbortError' || errorName === 'TimeoutError') {
    return true;
  }
  
  return false;
}
