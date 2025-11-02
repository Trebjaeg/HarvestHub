/**
 * Authentication utility functions for robust URL handling and security
 */

/**
 * Validates if a returnUrl is safe for same-origin redirects
 * @param returnUrl - The URL to validate
 * @param baseUrl - The base URL of the application (from environment)
 * @returns boolean indicating if the URL is safe
 */
export function isValidReturnUrl(returnUrl: string, baseUrl?: string): boolean {
  if (!returnUrl) return false;
  
  try {
    // Must start with / for relative paths
    if (!returnUrl.startsWith('/')) {
      return false;
    }
    
    // Prevent protocol relative URLs like //evil.com
    if (returnUrl.startsWith('//')) {
      return false;
    }
    
    // Decode the URL to check for encoded dangerous patterns
    const decoded = decodeURIComponent(returnUrl);
    
    // Check for dangerous patterns in decoded URL
    if (decoded.includes('//') || decoded.includes('javascript:') || decoded.includes('data:')) {
      return false;
    }
    
    // If we have a baseUrl, do additional validation
    if (baseUrl) {
      try {
        const fullUrl = new URL(returnUrl, baseUrl);
        const baseUrlObj = new URL(baseUrl);
        
        // Must be same origin
        if (fullUrl.origin !== baseUrlObj.origin) {
          return false;
        }
      } catch {
        // If URL construction fails, it's invalid
        return false;
      }
    }
    
    return true;
  } catch {
    // If any error occurs during validation, consider it unsafe
    return false;
  }
}

/**
 * Sanitizes and validates a returnUrl, providing a safe fallback
 * @param returnUrl - The potentially unsafe URL
 * @param fallback - Fallback URL (default: /home)
 * @param baseUrl - Base URL for validation
 * @returns A safe, validated URL
 */
export function sanitizeReturnUrl(
  returnUrl: string | null | undefined, 
  fallback: string = '/home',
  baseUrl?: string
): string {
  if (!returnUrl) {
    return fallback;
  }
  
  try {
    // First decode if it's encoded
    const decoded = decodeURIComponent(returnUrl);
    
    // Validate the decoded URL
    if (isValidReturnUrl(decoded, baseUrl)) {
      return decoded;
    }
  } catch {
    // Decoding failed, use original
  }
  
  // If validation fails, try the original
  if (isValidReturnUrl(returnUrl, baseUrl)) {
    return returnUrl;
  }
  
  // If all validation fails, use fallback
  return fallback;
}

/**
 * Checks if a path should be protected (requires authentication)
 * @param pathname - The path to check
 * @returns boolean indicating if the path is protected
 */
export function isProtectedPath(pathname: string): boolean {
  const protectedRoutes = [
    '/home',
    '/shop',
    '/profile', 
    '/my-profile',
    '/dashboard',
    '/orders',
    '/farmer',
    '/sellerdashboard',
    '/buyerdashboard', 
    '/buyer-profile',
    '/seller-profile'
  ];
  
  return protectedRoutes.some(route => pathname.startsWith(route));
}

/**
 * Checks if a path is an admin-only route
 * @param pathname - The path to check
 * @returns boolean indicating if the path is admin-only
 */
export function isAdminPath(pathname: string): boolean {
  const adminRoutes = ['/admin'];
  return adminRoutes.some(route => pathname.startsWith(route));
}

/**
 * Checks if a path is public (doesn't require authentication)
 * @param pathname - The path to check
 * @returns boolean indicating if the path is public
 */
export function isPublicPath(pathname: string): boolean {
  const publicRoutes = [
    '/',
    '/auth',
    '/privacy',
    '/terms',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/reset-password',
    '/api/auth/request-password-reset',
    '/api/auth/verify-email',
    '/api/auth/check-email',
    '/api/auth/verify-code',
    '/api/auth/verify-reset-code',
    '/api/auth/send-verification-code',
    '/api/auth/resend-verification',
    '/api/auth/check-verification',
    '/api/auth/csrf-token',
    '/api/auth/post-login-redirect',
    '/api/auth/roles',
    '/api/products',
    '/api/promo-banners',
    '/api/best-sellers',
    '/api/deals',
    '/api/deals/banner',
    '/api/top-farmers',
    '/api/sellers',
    '/api/sellers/list'
  ];
  
  return publicRoutes.includes(pathname) || 
         pathname.startsWith('/auth/reset-password') ||
         pathname.startsWith('/auth/verify') ||
         pathname.startsWith('/seller/') ||
         pathname.startsWith('/api/sellers/') ||
         pathname.startsWith('/_next') ||
         pathname.startsWith('/static');
}

/**
 * Checks if a path is an auth-related route that should never be treated as protected
 * @param pathname - The path to check
 * @returns boolean indicating if the path is auth-related
 */
export function isAuthPath(pathname: string): boolean {
  return pathname === '/auth' || 
         pathname.startsWith('/auth/') ||
         pathname.startsWith('/api/auth/');
}

/**
 * Checks if a path requires seller role
 * @param pathname - The path to check
 * @returns boolean indicating if the path is seller-only
 */
export function isSellerPath(pathname: string): boolean {
  const sellerRoutes = [
    '/sellerdashboard',
    '/seller-profile',
    '/api/seller'
  ];
  
  return sellerRoutes.some(route => pathname.startsWith(route));
}

/**
 * Checks if a path is buyer-accessible
 * @param pathname - The path to check
 * @returns boolean indicating if the path is for buyers
 */
export function isBuyerPath(pathname: string): boolean {
  const buyerRoutes = [
    '/buyerdashboard',
    '/buyer-profile',
    '/shop',
    '/api/buyer'
  ];
  
  return buyerRoutes.some(route => pathname.startsWith(route));
}

/**
 * Gets the base URL from environment variables
 * @returns The base URL for the application
 */
export function getBaseUrl(): string {
  // Check client-side first
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Server-side: Use your existing environment variables
  const baseUrl = process.env.NEXTAUTH_URL || 
                  process.env.NEXT_PUBLIC_API_URL || 
                  process.env.VERCEL_URL;
  
  if (baseUrl) {
    return baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
  }
  
  // Fallback for development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001';  // Updated to match your current port
  }
  
  // Production fallback
  return 'https://harvesthubph.app';
}

/**
 * Prevents redirect loops by checking if returnUrl points to auth routes
 * @param returnUrl - The URL to check
 * @returns A safe URL that won't cause loops
 */
export function preventAuthLoop(returnUrl: string): string {
  // If returnUrl is an auth route, replace with safe default
  if (isAuthPath(returnUrl)) {
    return '/home';
  }
  
  return returnUrl;
}

/**
 * Safely encodes a URL for query parameters
 * @param url - The URL to encode
 * @returns Encoded URL safe for query parameters
 */
export function safeEncodeUrl(url: string): string {
  try {
    return encodeURIComponent(url);
  } catch {
    // If encoding fails, return a safe default
    return encodeURIComponent('/home');
  }
}

/**
 * Safely decodes a URL from query parameters
 * @param encodedUrl - The encoded URL to decode
 * @returns Decoded URL or null if decoding fails
 */
export function safeDecodeUrl(encodedUrl: string): string | null {
  try {
    return decodeURIComponent(encodedUrl);
  } catch {
    // If decoding fails, return null
    return null;
  }
}