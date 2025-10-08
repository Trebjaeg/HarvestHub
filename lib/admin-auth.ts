// Utility for making authenticated admin API requests

export const getAuthHeaders = (): HeadersInit => {
  const storedToken = localStorage.getItem('hh_token') || localStorage.getItem('auth-token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (storedToken) {
    headers['Authorization'] = `Bearer ${storedToken}`;
  }
  
  return headers;
};

export const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
  const headers = getAuthHeaders();
  
  return fetch(url, {
    method: 'GET',
    credentials: 'include',
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
};