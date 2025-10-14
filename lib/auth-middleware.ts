import { NextRequest, NextResponse } from 'next/server';
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
    if (user.status === 'suspended') {
      await AuditLog.create({
        performedBy: user._id,
        action: 'admin_action_failed',
        targetUser: user._id,
        reason: 'Access attempt by suspended user',
        details: {
          requestPath: req.nextUrl.pathname,
          userAgent: req.headers.get('user-agent'),
          ip: req.ip || req.headers.get('x-forwarded-for')
        },
        ipAddress: req.ip || req.headers.get('x-forwarded-for'),
        userAgent: req.headers.get('user-agent'),
        severity: 'medium'
      });
      
      return { 
        error: 'Account suspended. Please contact support or submit an appeal.', 
        status: 403 
      };
    }

    if (user.status === 'deleted') {
      return { error: 'Account not found', status: 404 };
    }

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
          ipAddress: req.ip || req.headers.get('x-forwarded-for'),
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
  return req.ip || 
         req.headers.get('x-forwarded-for')?.split(',')[0] || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

// Utility function to log admin actions
export async function logAdminAction(
  performedBy: string,
  action: string,
  targetUser: string | null,
  reason: string,
  details: any = {},
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