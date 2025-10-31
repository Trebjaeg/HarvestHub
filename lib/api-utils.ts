/**
 * Get the base URL for API calls
 * Universal solution that works in development and production
 */
export const getApiBaseUrl = (): string => {
  // For client-side (browser) - always use current origin
  if (typeof window !== 'undefined') {
    // This automatically handles:
    // - Production: https://harvesthubph.app
    // - Development: http://localhost:3001 (or any dynamic port)
    // - Any deployment environment
    return window.location.origin;
  }

  // For server-side rendering - use environment variables
  return process.env.NEXT_PUBLIC_API_URL || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || '';
};

/**
 * Create a full API URL for fetch requests
 * This ensures consistent URL resolution across all environments
 */
export const createApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  
  // If no base URL, use relative path (works for same-origin requests)
  if (!baseUrl) {
    return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  }
  
  // Ensure endpoint starts with /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  return `${baseUrl}${cleanEndpoint}`;
};

/**
 * Universal fetch wrapper that handles URL resolution
 * Production-ready with proper error handling
 */
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = createApiUrl(endpoint);
  
  // Get token from localStorage as fallback for mobile browsers
  let authHeaders: HeadersInit = {};
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('hh_token') || 
                  localStorage.getItem('auth-token') || 
                  localStorage.getItem('userToken');
    
    if (token) {
      authHeaders = {
        'Authorization': `Bearer ${token}`
      };
      if (process.env.NODE_ENV === 'development') {
        
      }
    }
  }
  
  const defaultOptions: RequestInit = {
    credentials: 'include', // Always send cookies
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders, // Add auth header if token exists
      ...options.headers,
    },
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  if (process.env.NODE_ENV === 'development') {
    
  }

  try {
    const response = await fetch(url, mergedOptions);
    if (process.env.NODE_ENV === 'development') {
      
    }
    return response;
  } catch (error) {
    console.error(`🌐 API Error: ${error}`);
    throw error;
  }
};
