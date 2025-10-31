import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { 
  isProtectedPath, 
  isAdminPath, 
  isPublicPath, 
  isAuthPath, 
  isSellerPath,
  isBuyerPath,
  sanitizeReturnUrl, 
  preventAuthLoop,
  safeEncodeUrl
} from '@/lib/auth-utils';
import { fetchAuthoritativeUser, RoleHierarchy } from '@/lib/rbac';

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
  
  // Create response - will be used throughout
  const response = NextResponse.next();
  
  // Apply security headers to all responses
  applySecurityHeaders(response);
  
  // Add cache control headers to prevent caching of protected pages
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
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
  const isPublic = isPublicPath(pathname);
  
  if (isPublic) {
    return response;
  }

  // Check if route requires protection
  const isProtectedRoute = isProtectedPath(pathname);
  const isAdminRoute = isAdminPath(pathname);
  const isApiRoute = pathname.startsWith('/api/');

  // If not a protected route, admin route, or API route, allow access (public route)
  if (!isApiRoute && !isProtectedRoute && !isAdminRoute) {
    return response;
  }

  // For protected or admin routes, check authentication
  // Get token from cookies or Authorization header
  let token = request.cookies.get('auth-token')?.value || 
              request.cookies.get('userToken')?.value ||
              request.cookies.get('hh_token')?.value;
  
  let tokenSource = 'cookie';

  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      tokenSource = 'authorization-header';
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
    
    // Build return URL with query parameters
    const fullPath = pathname + request.nextUrl.search;
    const safeReturnUrl = preventAuthLoop(fullPath);
    
    // Redirect to auth page with encoded return URL
    const loginUrl = new URL('/auth', request.url);
    // Don't double encode - searchParams.set will encode it
    loginUrl.searchParams.set('returnUrl', safeReturnUrl);
    
    return NextResponse.redirect(loginUrl);
  }

  // Verify token
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as DecodedToken;
    console.log(`🔐 Middleware: Token decoded successfully for user: ${decoded.email}`);
    
    // Check if token is expired
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      console.log(`🔐 Middleware: Token expired for user: ${decoded.email}`);
      throw new Error('Token expired');
    }

    // Fetch authoritative user data from database for role checking
    // NEVER trust JWT claims for roles - always fetch from DB
    const user = await fetchAuthoritativeUser(decoded.userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Only block DELETED users from accessing routes
    // SUSPENDED users can access routes but will have restricted actions via API guards
    if (user.status === 'deleted') {
      throw new Error('User account has been deleted');
    }

    // Check role-based access
    const requiresSeller = isSellerPath(pathname);
    const requiresBuyer = isBuyerPath(pathname);
    const requiresAdmin = isAdminRoute;

    // Admin route access
    if (requiresAdmin && !RoleHierarchy.canAccessAdminFeatures(user)) {
      if (isApiRoute) {
        return NextResponse.json(
          { 
            error: 'Insufficient permissions',
            message: 'Admin access required'
          },
          { status: 403 }
        );
      }
      // Redirect non-admin users to their dashboard
      const userDashboard = RoleHierarchy.getDashboardRoute(user);
      return NextResponse.redirect(new URL(userDashboard, request.url));
    }

    // Seller route access
    if (requiresSeller) {
      // Special case: Allow ALL sellers (including unverified) to access their dashboard and verification
      // Verification happens WITHIN the dashboard, so they need access first
      // Note: Due to route group (sellerdashboard), the actual route is /profile
      const isSellerDashboard = pathname === '/profile' || 
                                pathname.startsWith('/profile/') ||
                                pathname === '/sellerdashboard' || 
                                pathname.startsWith('/sellerdashboard/');
      
      // Allow verification-related endpoints and profile/stats for all sellers
      const isVerificationEndpoint = pathname.startsWith('/api/seller/verification');
      const isProfileEndpoint = pathname === '/api/seller/profile' || 
                                pathname === '/api/seller/stats' ||
                                pathname === '/api/seller/low-stock-products' ||
                                pathname === '/api/seller/upload-profile-image';
      
      if (isSellerDashboard || isVerificationEndpoint || isProfileEndpoint) {
        // Dashboard/verification/profile access: Allow if user has seller role (regardless of verification)
        if (user.role !== 'seller' && user.role !== 'admin' && user.role !== 'superadmin') {
          if (isApiRoute) {
            return NextResponse.json(
              { 
                error: 'Insufficient permissions',
                message: 'Seller role required'
              },
              { status: 403 }
            );
          }
          // Redirect non-sellers to buyer profile
          return NextResponse.redirect(new URL('/buyer-profile', request.url));
        }
      } else {
        // Other seller features (products, orders): Require verification
        if (!RoleHierarchy.canAccessSellerFeatures(user)) {
          if (isApiRoute) {
            return NextResponse.json(
              { 
                error: 'Insufficient permissions',
                message: 'Verified seller access required'
              },
              { status: 403 }
            );
          }
          // Redirect unverified sellers to their dashboard to complete verification
          return NextResponse.redirect(new URL('/profile', request.url));
        }
      }
    }

    // Buyer route access - all authenticated users can access buyer features
    // Sellers have union access (can access both seller and buyer features)
    if (requiresBuyer && !RoleHierarchy.canAccessBuyerFeatures(user)) {
      if (isApiRoute) {
        return NextResponse.json(
          { 
            error: 'Insufficient permissions',
            message: 'Buyer access required'
          },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL('/auth', request.url));
    }

    // Token is valid and role checks passed, proceed with request
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-user-email', user.email);
    requestHeaders.set('x-user-role', user.role);
    requestHeaders.set('x-user-seller-status', user.sellerStatus);
    requestHeaders.set('x-can-access-seller', RoleHierarchy.canAccessSellerFeatures(user).toString());
    requestHeaders.set('x-can-access-buyer', RoleHierarchy.canAccessBuyerFeatures(user).toString());

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  } catch (error) {
    
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