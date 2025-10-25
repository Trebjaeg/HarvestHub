import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || '';

interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: 'buyer' | 'seller' | 'farmer' | 'admin' | 'superadmin';
  sellerStatus: 'none' | 'pending' | 'verified' | 'rejected';
  status: 'active' | 'suspended' | 'deleted';
  profileImage?: string;
}

/**
 * Role hierarchy definition:
 * - Superadmin: Full access to everything
 * - Admin: Full admin access, can manage users and content
 * - Seller/Farmer: Can access seller dashboard + buyer dashboard (union access)
 * - Buyer: Can only access buyer dashboard
 */
export class RoleHierarchy {
  private static readonly ROLE_LEVELS = {
    'buyer': 1,
    'seller': 2,
    'farmer': 2,    // Farmer is same as seller
    'admin': 3,
    'superadmin': 4
  };

  /**
   * Check if a user's role meets or exceeds the required role level
   */
  static hasRole(userRole: string, requiredRole: string): boolean {
    const userLevel = this.ROLE_LEVELS[userRole as keyof typeof this.ROLE_LEVELS] || 0;
    const requiredLevel = this.ROLE_LEVELS[requiredRole as keyof typeof this.ROLE_LEVELS] || 0;
    return userLevel >= requiredLevel;
  }

  /**
   * Check if user can access seller dashboard
   * Any user with seller/farmer role can access the dashboard (to see verification status, etc.)
   */
  static canAccessSellerDashboard(user: AuthenticatedUser): boolean {
    return user.role === 'seller' || user.role === 'farmer' || user.role === 'admin' || user.role === 'superadmin';
  }

  /**
   * Check if user can access seller features (listing products, managing inventory, etc.)
   * Seller/Farmer role must be 'seller' or 'farmer' AND sellerStatus must be 'verified'
   */
  static canAccessSellerFeatures(user: AuthenticatedUser): boolean {
    return (user.role === 'seller' || user.role === 'farmer' || user.role === 'admin' || user.role === 'superadmin') 
           && user.sellerStatus === 'verified';
  }

  /**
   * Check if user can access buyer features
   * All roles except admin/superadmin can access buyer features
   * Sellers and farmers have union access (can buy AND sell)
   */
  static canAccessBuyerFeatures(user: AuthenticatedUser): boolean {
    return user.role === 'buyer' || user.role === 'seller' || user.role === 'farmer';
  }

  /**
   * Check if user can access admin features
   */
  static canAccessAdminFeatures(user: AuthenticatedUser): boolean {
    return user.role === 'admin' || user.role === 'superadmin';
  }

  /**
   * Check if user is superadmin
   */
  static isSuperAdmin(user: AuthenticatedUser): boolean {
    return user.role === 'superadmin';
  }

  /**
   * Get the appropriate dashboard route for user based on their role
   */
  static getDashboardRoute(user: AuthenticatedUser): string {
    if (user.role === 'admin' || user.role === 'superadmin') {
      return '/admin';
    }
    // Sellers/Farmers go to seller profile (route group makes it /profile, not /sellerdashboard/profile)
    // They may need to complete verification, but that's handled within the profile
    if (user.role === 'seller' || user.role === 'farmer') {
      return '/profile';
    }
    return '/buyer-profile';
  }
}

/**
 * Fetch authoritative user data from database
 * NEVER trust client-supplied role claims - always fetch from DB
 */
export async function fetchAuthoritativeUser(userId: string): Promise<AuthenticatedUser | null> {
  try {
    await dbConnect();
    
    const user = await User.findById(userId)
      .select('name email role sellerStatus status profileImage')
      .lean();
    
    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      sellerStatus: user.sellerStatus || 'none',
      status: user.status,
      profileImage: user.profileImage || undefined
    };
  } catch (error) {
    console.error('Error fetching authoritative user:', error);
    return null;
  }
}

/**
 * Verify authentication token and fetch authoritative user data from database
 * This is the single source of truth for user authentication and roles
 */
export async function verifyAuthAndFetchUser(req: NextRequest): Promise<AuthenticatedUser> {
  // Get token from cookies or Authorization header
  let token = req.cookies.get('auth-token')?.value || 
              req.cookies.get('userToken')?.value ||
              req.cookies.get('hh_token')?.value;

  if (!token) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    throw new Error('No authentication token provided');
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    
    // Check if token is expired
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      throw new Error('Token expired');
    }

    // Fetch authoritative user data from database - NEVER trust JWT claims for roles
    const user = await fetchAuthoritativeUser(decoded.userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    if (user.status !== 'active') {
      throw new Error('User account is not active');
    }

    return user;
  } catch (error) {
    console.error('Authentication verification failed:', error);
    throw new Error('Invalid or expired authentication token');
  }
}

/**
 * Verify user can access seller features
 */
export async function verifySellerAccess(req: NextRequest): Promise<AuthenticatedUser> {
  const user = await verifyAuthAndFetchUser(req);
  
  if (!RoleHierarchy.canAccessSellerFeatures(user)) {
    throw new Error('Insufficient permissions - verified seller access required');
  }
  
  return user;
}

/**
 * Verify user can access buyer features (all authenticated users)
 */
export async function verifyBuyerAccess(req: NextRequest): Promise<AuthenticatedUser> {
  const user = await verifyAuthAndFetchUser(req);
  
  if (!RoleHierarchy.canAccessBuyerFeatures(user)) {
    throw new Error('Insufficient permissions - buyer access required');
  }
  
  return user;
}

/**
 * Verify user can access admin features
 */
export async function verifyAdminAccess(req: NextRequest): Promise<AuthenticatedUser> {
  const user = await verifyAuthAndFetchUser(req);
  
  if (!RoleHierarchy.canAccessAdminFeatures(user)) {
    throw new Error('Insufficient permissions - admin access required');
  }
  
  return user;
}

/**
 * Verify user is superadmin
 */
export async function verifySuperAdminAccess(req: NextRequest): Promise<AuthenticatedUser> {
  const user = await verifyAuthAndFetchUser(req);
  
  if (!RoleHierarchy.isSuperAdmin(user)) {
    throw new Error('Insufficient permissions - superadmin access required');
  }
  
  return user;
}

/**
 * Check role permissions for a specific feature
 */
export function checkFeatureAccess(user: AuthenticatedUser, feature: 'seller' | 'buyer' | 'admin' | 'superadmin'): boolean {
  switch (feature) {
    case 'seller':
      return RoleHierarchy.canAccessSellerFeatures(user);
    case 'buyer':
      return RoleHierarchy.canAccessBuyerFeatures(user);
    case 'admin':
      return RoleHierarchy.canAccessAdminFeatures(user);
    case 'superadmin':
      return RoleHierarchy.isSuperAdmin(user);
    default:
      return false;
  }
}
