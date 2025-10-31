import AuditLog from '@/models/AuditLog';
import { NextRequest } from 'next/server';

interface CreateAuditLogParams {
  performedBy: string;
  action: string;
  targetUser?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  reason?: string;
  metadata?: Record<string, any>;
  details?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  previousState?: any;
  newState?: any;
  req?: NextRequest;
}

/**
 * Create an audit log entry
 * Use this to track all admin actions for compliance and security
 */
export async function createAuditLog(params: CreateAuditLogParams) {
  try {
    const {
      performedBy,
      action,
      targetUser,
      targetType,
      targetId,
      reason,
      metadata,
      details,
      severity = 'medium',
      previousState,
      newState,
      req
    } = params;

    // Extract IP and User Agent from request if provided
    let ipAddress = null;
    let userAgent = null;

    if (req) {
      // Get IP address
      ipAddress = 
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        req.headers.get('cf-connecting-ip') ||
        'unknown';

      // Get User Agent
      userAgent = req.headers.get('user-agent') || 'unknown';
    }

    const auditLog = await AuditLog.create({
      performedBy,
      action,
      targetUser: targetUser || null,
      targetType: targetType || null,
      targetId: targetId || null,
      reason: reason || '',
      metadata: metadata || {},
      details: details || {},
      severity,
      previousState: previousState || null,
      newState: newState || null,
      ipAddress,
      userAgent,
      createdAt: new Date()
    });

    return auditLog;
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw - audit log failures shouldn't break the main operation
    return null;
  }
}

/**
 * Audit log action types for reference
 */
export const AUDIT_ACTIONS = {
  // User management
  USER_SUSPENDED: 'user_suspended',
  USER_UNSUSPENDED: 'user_unsuspended',
  USER_DELETED: 'user_deleted',
  USER_WARNED: 'user_warned',
  USER_ROLE_CHANGED: 'user_role_changed',
  USER_TOKEN_INVALIDATED: 'user_token_invalidated',
  USER_PASSWORD_RESET: 'user_password_reset',
  USER_EMAIL_CHANGED: 'user_email_changed',
  
  // Appeals
  APPEAL_SUBMITTED: 'appeal_submitted',
  APPEAL_APPROVED: 'appeal_approved',
  APPEAL_REJECTED: 'appeal_rejected',
  
  // Listings
  LISTING_HIDDEN: 'listing_hidden',
  LISTING_RESTORED: 'listing_restored',
  
  // Admin
  ADMIN_LOGIN: 'admin_login',
  ADMIN_LOGOUT: 'admin_logout',
  ADMIN_ACTION_FAILED: 'admin_action_failed',
  ADMIN_SETTINGS_CHANGED: 'admin_settings_changed',
  
  // Seller verification
  SELLER_VERIFICATION_SUBMITTED: 'seller_verification_submitted',
  SELLER_VERIFICATION_APPROVED: 'seller_verification_approved',
  SELLER_VERIFICATION_REJECTED: 'seller_verification_rejected',
  
  // Reports
  REPORT_REVIEWED: 'report_reviewed',
  REPORT_RESOLVED: 'report_resolved',
  REPORT_DISMISSED: 'report_dismissed'
} as const;

/**
 * Severity levels for audit logs
 */
export const AUDIT_SEVERITY = {
  LOW: 'low' as const,
  MEDIUM: 'medium' as const,
  HIGH: 'high' as const,
  CRITICAL: 'critical' as const
};
