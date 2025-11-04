/**
 * Lalamove API Error Mapper
 * Maps Lalamove error codes to user-friendly messages
 */

export interface LalamoveError {
  id: string;
  message?: string;
}

export interface LalamoveErrorResponse {
  errors?: LalamoveError[];
  message?: string;
}

/**
 * Map Lalamove API error to user-friendly message
 */
export function mapLalamoveError(errorData: LalamoveErrorResponse, statusCode: number): string {
  // Check for errors array
  if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
    const firstError = errorData.errors[0];
    
    switch (firstError.id) {
      case 'ERR_INSUFFICIENT_STOPS':
        return 'Need pickup + at least one drop-off with pinned locations.';
      
      case 'ERR_INVALID_COORDINATES':
        return 'Please pin the exact location on the map.';
      
      case 'ERR_OUT_OF_SERVICE_AREA':
        return 'Address is outside Lalamove coverage area for the selected vehicle.';
      
      case 'ERR_UNSUPPORTED_SERVICE_TYPE':
      case 'ERR_SERVICE_UNAVAILABLE':
        return 'Selected vehicle not available for this route/time.';
      
      case 'ERR_INVALID_MARKET':
        return 'Service area configuration error. Please contact support.';
      
      case 'ERR_INVALID_SCHEDULE':
        return 'Invalid delivery schedule. Please select a valid time.';
      
      case 'ERR_INVALID_CONTACT':
        return 'Invalid contact information. Please check phone numbers.';
      
      case 'ERR_INSUFFICIENT_BALANCE':
        return 'Insufficient wallet balance. Please top up your Lalamove account.';
      
      case 'ERR_QUOTATION_EXPIRED':
        return 'Delivery quote has expired. Please request a new quote.';
      
      default:
        return firstError.message || 'Courier quote is temporarily unavailable.';
    }
  }
  
  // Fallback based on status code
  if (statusCode === 401 || statusCode === 403) {
    return 'Delivery service authentication failed. Please contact support.';
  }
  
  if (statusCode === 422) {
    return 'Invalid delivery request. Please check your address details.';
  }
  
  if (statusCode >= 500) {
    return 'Delivery service temporarily unavailable. Please try again.';
  }
  
  return errorData.message || 'Courier quote is temporarily unavailable.';
}

/**
 * Check if error is retryable (5xx or timeout)
 */
export function isRetryableError(statusCode: number): boolean {
  return statusCode >= 500 && statusCode < 600;
}

/**
 * Get server-side error log message (with more details)
 */
export function getServerErrorMessage(errorData: LalamoveErrorResponse, statusCode: number): string {
  const userMessage = mapLalamoveError(errorData, statusCode);
  const errorId = errorData.errors?.[0]?.id || 'UNKNOWN';
  return `${userMessage} (${errorId}) (HTTP ${statusCode})`;
}
