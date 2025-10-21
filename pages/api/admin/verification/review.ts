import { NextApiRequest, NextApiResponse } from 'next';
import { rateLimiter } from '@/lib/rate-limiter';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import SellerApplication from '@/models/SellerApplication';
import AuditLog from '@/models/AuditLog';
import dbConnect from '@/lib/mongodb';

interface DecodedToken {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

interface ReviewRequest {
  applicationId: string;
  action: 'approve' | 'reject';
  reason?: string;
}

/**
 * POST /api/admin/verification/review
 * Approve or reject seller verification application
 * Protected route - admin/superadmin only
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Authentication check
  try {
    await dbConnect();
    
    const token = req.cookies['auth-token'] || req.cookies.userToken || req.cookies.hh_token;
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    const user = await User.findById(decoded.userId);

    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: 'Admin access required' 
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ 
        error: 'Account not active',
        message: 'Your account is not active' 
      });
    }

    (req as any).user = user;
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const admin = (req as any).user;
    const { applicationId, action, reason }: ReviewRequest = req.body;

    // Validate required fields
    if (!applicationId || !action) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'applicationId and action are required',
      });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        error: 'Invalid action',
        message: 'action must be either approve or reject',
      });
    }

    // Rejection requires a reason
    if (action === 'reject' && !reason) {
      return res.status(400).json({
        error: 'Rejection reason required',
        message: 'A reason must be provided when rejecting an application',
      });
    }

    // Get application
    const application = await SellerApplication.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        error: 'Application not found',
        message: 'The specified application does not exist',
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        error: 'Application already reviewed',
        message: `This application has already been ${application.status}`,
      });
    }

    // Update application
    application.status = action === 'approve' ? 'approved' : 'rejected';
    application.reviewedAt = new Date();
    application.reviewedBy = admin._id;
    if (action === 'reject') {
      application.rejectionReason = reason;
    }

    // Add to audit trail
    application.auditTrail.push({
      action: action === 'approve' ? 'approved' : 'rejected',
      performedBy: admin._id,
      performedAt: new Date(),
      reason: action === 'reject' ? reason : undefined,
      metadata: {
        adminName: admin.name,
        adminEmail: admin.email,
      },
    });

    await application.save();

    // Update user seller status
    const sellerUser = await User.findById(application.userId);
    if (sellerUser) {
      sellerUser.sellerStatus = action === 'approve' ? 'verified' : 'rejected';
      await sellerUser.save();
    }

    // Create immutable audit log
    await AuditLog.create({
      action: `seller_verification_${action === 'approve' ? 'approved' : 'rejected'}`,
      performedBy: admin._id,
      targetType: 'SellerApplication',
      targetId: application._id,
      metadata: {
        sellerId: application.userId,
        sellerEmail: sellerUser?.email,
        reason: action === 'reject' ? reason : undefined,
        applicationStatus: application.status,
      },
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json({
      success: true,
      message: `Application ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      application: {
        id: application._id,
        status: application.status,
        reviewedAt: application.reviewedAt,
        reviewedBy: admin.name,
      },
    });
  } catch (error: any) {
    console.error('Error reviewing application:', error);
    return res.status(500).json({
      error: 'Failed to review application',
      message: error.message || 'An unexpected error occurred',
    });
  }
}

// Apply rate limiting
export default rateLimiter(handler, {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 reviews per window
});
