import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { 
  isProtectedPath, 
  isAdminPath, 
  isPublicPath, 
  isAuthPath, 
  sanitizeReturnUrl, 
  preventAuthLoop,
  safeEncodeUrl
} from '@/lib/auth-utils';

// Force Node.js runtime instead of Edge runtime for JWT verification
export const runtime = 'nodejs';

interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
  jti: string;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log(`🔐 Middleware: Processing request for ${pathname}`);
  
  // Apply security headers to all responses
  const response = NextResponse.next();
  applySecurityHeaders(response);
  
  // Skip middleware for static files and Next.js internals
  if (
    pathname.includes('/_next/') ||
    pathname.includes('/api/_next/') ||
    pathname.includes('/favicon.ico') ||
    pathname.includes('/images/') ||
    pathname.includes('/fonts/') ||
    pathname.includes('/locales/') ||
    pathname.includes('/uploads/') ||
    pathname.startsWith('/_vercel') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.ttf')
  ) {
    return response;
  }

  // Check if route is public (doesn't need auth)
  if (isPublicPath(pathname)) {
    console.log(`🔐 Middleware: ${pathname} is public, allowing access`);
    return response;
  }

  // Check if route requires protection
  const isProtectedRoute = isProtectedPath(pathname);
  const isAdminRoute = isAdminPath(pathname);
  const isApiRoute = pathname.startsWith('/api/');

  console.log(`🔐 Middleware: ${pathname} - Protected: ${isProtectedRoute}, Admin: ${isAdminRoute}, API: ${isApiRoute}`);

  // If not a route that needs protection, continue
  if (!isProtectedRoute && !isAdminRoute && !isApiRoute) {
    console.log(`🔐 Middleware: ${pathname} doesn't need protection, allowing access`);
    return response;
  }

  // Get token from cookies or Authorization header
  let token = request.cookies.get('auth-token')?.value || 
              request.cookies.get('userToken')?.value ||
              request.cookies.get('hh_token')?.value;

  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  
  console.log(`🔐 Middleware: Checking ${pathname}`);
  console.log(`🔐 Middleware: All cookies:`, request.cookies.getAll());
  console.log(`🔐 Middleware: Token found: ${!!token}`);

  // No token found - redirect to auth or return 401 for API
  if (!token) {
    if (isApiRoute) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          message: 'Please log in to access this resource'
        },
        { status: 401 }
      );
    }
    
    // Build return URL with query parameters
    const fullPath = pathname + request.nextUrl.search;
    const safeReturnUrl = preventAuthLoop(fullPath);
    
    // Redirect to auth page with encoded return URL
    const loginUrl = new URL('/auth', request.url);
    // Don't double encode - searchParams.set will encode it
    loginUrl.searchParams.set('returnUrl', safeReturnUrl);
    
    console.log(`🔐 Middleware: Redirecting to auth with returnUrl: ${safeReturnUrl}`);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token
  try {
    console.log(`🔐 Middleware: Attempting to verify token for ${pathname}`);
    console.log(`🔐 Middleware: Token exists: ${!!token}`);
    console.log(`🔐 Middleware: Token length: ${token?.length || 0}`);
    console.log(`🔐 Middleware: JWT_SECRET exists: ${!!process.env.JWT_SECRET}`);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    console.log(`🔐 Middleware: Token decoded successfully for user: ${decoded.email}`);
    
    // Check if token is expired
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      console.log(`🔐 Middleware: Token expired for user: ${decoded.email}`);
      throw new Error('Token expired');
    }

    // For admin routes, check role
    if (isAdminRoute) {
      const hasAdminAccess = decoded.role === 'admin' || decoded.role === 'superadmin';
      
      if (!hasAdminAccess) {
        console.log(`🔐 Middleware: User ${decoded.email} lacks admin access for ${pathname}`);
        if (isApiRoute) {
          return NextResponse.json(
            { 
              error: 'Insufficient permissions',
              message: 'Admin access required'
            },
            { status: 403 }
          );
        }
        
        // Redirect non-admin users away from admin routes
        return NextResponse.redirect(new URL('/home', request.url));
      }
    }

    // Token is valid, proceed with request
    console.log(`🔐 Middleware: Access granted to ${pathname} for user: ${decoded.email}`);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decoded.userId);
    requestHeaders.set('x-user-email', decoded.email);
    requestHeaders.set('x-user-role', decoded.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  } catch (error) {
    console.error(`🔐 Middleware: Token verification failed for ${pathname}:`, error);
    
    // Invalid token - clear cookies and redirect
    if (isApiRoute) {
      return NextResponse.json(
        { 
          error: 'Invalid or expired token',
          message: 'Please log in again'
        },
        { status: 401 }
      );
    }
    
    // Build return URL with query parameters
    const fullPath = pathname + request.nextUrl.search;
    const safeReturnUrl = preventAuthLoop(fullPath);
    
    // Clear invalid token and redirect
    const loginUrl = new URL('/auth', request.url);
    // Don't double encode - searchParams.set will encode it
    loginUrl.searchParams.set('returnUrl', safeReturnUrl);
    const redirectResponse = NextResponse.redirect(loginUrl);
    
    // Clear auth cookies
    redirectResponse.cookies.delete('auth-token');
    redirectResponse.cookies.delete('userToken');
    redirectResponse.cookies.delete('hh_token');
    
    console.log(`🔐 Middleware: Token invalid, redirecting to auth with returnUrl: ${safeReturnUrl}`);
    return redirectResponse;
  }
}

function applySecurityHeaders(response: NextResponse) {
  // Security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};