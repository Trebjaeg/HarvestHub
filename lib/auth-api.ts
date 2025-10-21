import { NextRequest, NextResponse } from 'next/server';
import { 
  verifyAuthAndFetchUser, 
  verifySellerAccess, 
  verifyBuyerAccess, 
  verifyAdminAccess, 
  verifySuperAdminAccess,
  AuthenticatedUser 
} from '@/lib/rbac';

// Re-export for backward compatibility
export type { AuthenticatedUser } from '@/lib/rbac';

/**
 * Verify authentication token from request
 * Throws error if token is invalid or missing
 * Uses authoritative role from database
 */
export async function verifyAuth(req: NextRequest): Promise<AuthenticatedUser> {
  return await verifyAuthAndFetchUser(req);
}

/**
 * Verify user has seller access (seller role + verified status)
 */
export async function verifySeller(req: NextRequest): Promise<AuthenticatedUser> {
  return await verifySellerAccess(req);
}

/**
 * Verify user has buyer access (all authenticated users)
 */
export async function verifyBuyer(req: NextRequest): Promise<AuthenticatedUser> {
  return await verifyBuyerAccess(req);
}

/**
 * Verify user has admin or superadmin role
 */
export async function verifyAdmin(req: NextRequest): Promise<AuthenticatedUser> {
  return await verifyAdminAccess(req);
}

/**
 * Verify user has superadmin role
 */
export async function verifySuperAdmin(req: NextRequest): Promise<AuthenticatedUser> {
  return await verifySuperAdminAccess(req);
}

/**
 * Wrapper for protected API routes (basic authentication)
 * Returns 401 with JSON error if authentication fails
 */
export function withAuth<T>(
  handler: (req: NextRequest, user: AuthenticatedUser, ...args: any[]) => Promise<NextResponse<T>>
) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse<T> | NextResponse<{error: string}>> => {
    try {
      const user = await verifyAuth(req);
      return await handler(req, user, ...args);
    } catch (error) {
      console.error('Authentication failed in API route:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}

/**
 * Wrapper for seller-only API routes
 * Sellers get union access (can access buyer features too)
 * Returns 401/403 with JSON error if authentication or authorization fails
 */
export function withSellerAuth<T>(
  handler: (req: NextRequest, seller: AuthenticatedUser, ...args: any[]) => Promise<NextResponse<T>>
) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse<T> | NextResponse<{error: string}>> => {
    try {
      const seller = await verifySeller(req);
      return await handler(req, seller, ...args);
    } catch (error) {
      console.error('Seller authentication failed in API route:', error);
      const status = error instanceof Error && error.message.includes('Insufficient permissions') ? 403 : 401;
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Seller authentication failed' },
        { status }
      );
    }
  };
}

/**
 * Wrapper for buyer API routes
 * Buyers can only access buyer features (no seller access)
 * Returns 401/403 with JSON error if authentication or authorization fails
 */
export function withBuyerAuth<T>(
  handler: (req: NextRequest, buyer: AuthenticatedUser, ...args: any[]) => Promise<NextResponse<T>>
) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse<T> | NextResponse<{error: string}>> => {
    try {
      const buyer = await verifyBuyer(req);
      return await handler(req, buyer, ...args);
    } catch (error) {
      console.error('Buyer authentication failed in API route:', error);
      const status = error instanceof Error && error.message.includes('Insufficient permissions') ? 403 : 401;
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Buyer authentication failed' },
        { status }
      );
    }
  };
}

/**
 * Wrapper for admin-only API routes
 * Returns 401/403 with JSON error if authentication or authorization fails
 */
export function withAdminAuth<T>(
  handler: (req: NextRequest, admin: AuthenticatedUser, ...args: any[]) => Promise<NextResponse<T>>
) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse<T> | NextResponse<{error: string}>> => {
    try {
      const admin = await verifyAdmin(req);
      return await handler(req, admin, ...args);
    } catch (error) {
      console.error('Admin authentication failed in API route:', error);
      const status = error instanceof Error && error.message.includes('Insufficient permissions') ? 403 : 401;
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Authentication failed' },
        { status }
      );
    }
  };
}

/**
 * Wrapper for superadmin-only API routes
 * Returns 401/403 with JSON error if authentication or authorization fails
 */
export function withSuperAdminAuth<T>(
  handler: (req: NextRequest, superadmin: AuthenticatedUser, ...args: any[]) => Promise<NextResponse<T>>
) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse<T> | NextResponse<{error: string}>> => {
    try {
      const superadmin = await verifySuperAdmin(req);
      return await handler(req, superadmin, ...args);
    } catch (error) {
      console.error('Superadmin authentication failed in API route:', error);
      const status = error instanceof Error && error.message.includes('Insufficient permissions') ? 403 : 401;
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Authentication failed' },
        { status }
      );
    }
  };
}
