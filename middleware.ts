import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  tokenVersion: number;
  iat: number;
  exp: number;
}

// Protected routes that require authentication
const PROTECTED_ROUTES = [
  '/home',
  '/profile', 
  '/dashboard',
  '/orders',
  '/farmer',
  '/sellerdashboard'
];

// Admin-only routes
const ADMIN_ROUTES = [
  '/admin'
];

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
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
  '/api/products', // Public product browsing
  '/api/promo-banners' // Public banner viewing
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
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

  // Check if route is public
  if (PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/auth/reset-password')) {
    return response;
  }

  // Check if route requires protection
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route));
  const isApiRoute = pathname.startsWith('/api/');

  if (!isProtectedRoute && !isAdminRoute && !isApiRoute) {
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
    
    // Redirect to auth page with return URL
    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    
    // Check if token is expired
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      throw new Error('Token expired');
    }

    // For admin routes, check role
    if (isAdminRoute) {
      const hasAdminAccess = decoded.role === 'admin' || decoded.role === 'superadmin';
      
      if (!hasAdminAccess) {
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
    console.error('Token verification failed:', error);
    
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
    
    // Clear invalid token and redirect
    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set('returnUrl', pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);
    
    // Clear auth cookies
    redirectResponse.cookies.delete('auth-token');
    redirectResponse.cookies.delete('userToken');
    redirectResponse.cookies.delete('hh_token');
    
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