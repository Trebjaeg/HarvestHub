import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '../models/User';
import AuditLog from '../models/AuditLog';

interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  tokenVersion: number;
  iat: number;
  exp: number;
}

interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
    status?: 'active' | 'suspended' | 'deleted';
    iat: number;
    exp: number;
  };
  error?: string;
}

export async function withAuth(req: NextRequest, requiredRole?: string) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return { error: 'No token provided', status: 401 };
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    
    await dbConnect();
    
    // Get current user from database
    const user = await User.findById(decoded.userId).select('+tokenVersion +status +role');
    
    if (!user) {
      return { error: 'User not found', status: 401 };
    }

    // Check if user account is suspended or deleted
    // SUSPENDED users can login/view but cannot perform transactional actions
    // DELETED users are completely blocked
    if (user.status === 'deleted') {
      return { error: 'Account not found', status: 404 };
    }

    // Note: Suspended status is NOT blocked here - it's passed through
    // Individual API endpoints must check suspension for transactional actions

    // Check token version (for session invalidation)
    if (user.tokenVersion !== decoded.tokenVersion) {
      return { error: 'Token invalidated. Please login again.', status: 401 };
    }

    // Check role requirements
    if (requiredRole) {
      const roleHierarchy = { user: 0, admin: 1, superadmin: 2 };
      const userRoleLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

      if (userRoleLevel < requiredRoleLevel) {
        await AuditLog.create({
          performedBy: user._id,
          action: 'admin_action_failed',
          targetUser: user._id,
          reason: `Insufficient permissions. Required: ${requiredRole}, Has: ${user.role}`,
          details: {
            requestPath: req.nextUrl.pathname,
            requiredRole,
            userRole: user.role
          },
          ipAddress: getClientIP(req),
          userAgent: req.headers.get('user-agent'),
          severity: 'high'
        });

        return { error: 'Insufficient permissions', status: 403 };
      }
    }

    return { user, status: 200 };
  } catch (error) {
    console.error('Auth middleware error:', error);
    return { error: 'Invalid token', status: 401 };
  }
}

export async function withAdminAuth(req: NextRequest) {
  return withAuth(req, 'admin');
}

export async function withSuperAdminAuth(req: NextRequest) {
  return withAuth(req, 'superadmin');
}

// Utility function to get user IP
export function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0] || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

// Utility function to log admin actions
export async function logAdminAction(
  performedBy: string,
  action: string,
  targetUser: string | null,
  reason: string,
  details: Record<string, unknown> = {},
  req?: NextRequest,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
) {
  try {
    await dbConnect();
    
    await AuditLog.create({
      performedBy,
      action,
      targetUser,
      reason,
      details,
      ipAddress: req ? getClientIP(req) : null,
      userAgent: req ? req.headers.get('user-agent') : null,
      severity
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}

export async function verifyToken(request: NextRequest): Promise<AuthResult> {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return { success: false, error: 'No token provided' };
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return { success: false, error: 'JWT secret not configured' };
    }

    const decoded = jwt.verify(token, secret) as DecodedToken;
    
    // Fetch user from database to get current status
    await dbConnect();
    const user = await User.findById(decoded.userId).select('status email role isVerified');
    
    if (!user || user.status === 'deleted') {
      return { success: false, error: 'User not found' };
    }
    
    // Note: We don't block unverified users from basic features like chat/messaging
    // Only specific features (like becoming a seller) require email verification
    
    return { 
      success: true, 
      user: {
        id: decoded.userId,
        email: user.email || decoded.email,
        role: user.role || decoded.role,
        status: user.status || 'active',
        isVerified: user.isVerified || false,
        iat: decoded.iat,
        exp: decoded.exp
      }
    };
  } catch (error) {
    return { success: false, error: 'Invalid token' };
  }
}

export async function verifyBuyerAuth(req: NextRequest) {
  try {
    const authResult = await verifyToken(req);
    
    if (!authResult.success) {
      return { success: false, error: authResult.error };
    }

    // Verify user has buyer role or is a user (buyers are users with purchasing capability)
    if (authResult.user && (authResult.user.role === 'user' || authResult.user.role === 'buyer')) {
      return { 
        success: true, 
        userId: authResult.user.id,
        user: authResult.user 
      };
    }

    return { success: false, error: 'Access denied. Buyer role required.' };
  } catch (error) {
    console.error('Buyer auth verification error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

export async function verifySellerAuth(req: NextRequest) {
  try {
    const authResult = await verifyToken(req);
    
    if (!authResult.success) {
      return { success: false, error: authResult.error };
    }

    // Verify user has seller role or admin/superadmin (who can access seller features)
    if (authResult.user && ['seller', 'admin', 'superadmin'].includes(authResult.user.role)) {
      return { 
        success: true, 
        userId: authResult.user.id,
        user: authResult.user 
      };
    }

    return { success: false, error: 'Access denied. Seller role required.' };
  } catch (error) {
    console.error('Seller auth verification error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}