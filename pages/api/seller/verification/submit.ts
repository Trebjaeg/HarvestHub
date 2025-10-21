import { NextApiRequest, NextApiResponse } from 'next';
import { rateLimiter } from '@/lib/rate-limiter';
import { validateUploadedFile, getFileChecksum } from '@/lib/digitalocean-upload';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import SellerApplication from '@/models/SellerApplication';
import AuditLog from '@/models/AuditLog';
import dbConnect from '@/lib/mongodb';

interface SubmitRequest {
  governmentIdFrontKey: string;
  governmentIdFrontOriginalName: string;
  governmentIdFrontSize: number;
  governmentIdFrontMimeType: string;
  governmentIdBackKey: string;
  governmentIdBackOriginalName: string;
  governmentIdBackSize: number;
  governmentIdBackMimeType: string;
  birDocumentKey: string;
  birDocumentOriginalName: string;
  birDocumentSize: number;
  birDocumentMimeType: string;
}

interface DecodedToken {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

/**
 * POST /api/seller/verification/submit
 * Submit verification application with uploaded documents
 * Protected route - seller only
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

    if (!user || user.role !== 'seller') {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: 'Seller access required' 
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
    const user = (req as any).user;
    const {
      governmentIdFrontKey,
      governmentIdFrontOriginalName,
      governmentIdFrontSize,
      governmentIdFrontMimeType,
      governmentIdBackKey,
      governmentIdBackOriginalName,
      governmentIdBackSize,
      governmentIdBackMimeType,
      birDocumentKey,
      birDocumentOriginalName,
      birDocumentSize,
      birDocumentMimeType,
    }: SubmitRequest = req.body;

    // Validate required fields - all three documents (ID front, ID back, BIR) must be present
    if (
      !governmentIdFrontKey ||
      !governmentIdFrontOriginalName ||
      !governmentIdFrontSize ||
      !governmentIdFrontMimeType ||
      !governmentIdBackKey ||
      !governmentIdBackOriginalName ||
      !governmentIdBackSize ||
      !governmentIdBackMimeType ||
      !birDocumentKey ||
      !birDocumentOriginalName ||
      !birDocumentSize ||
      !birDocumentMimeType
    ) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'All three documents are required: Government ID (front and back) and BIR certificate',
      });
    }

    // Check if user already has a pending or approved application
    const existingApplication = await SellerApplication.findOne({
      userId: user._id,
      status: { $in: ['pending', 'approved'] },
    });

    if (existingApplication) {
      if (existingApplication.status === 'approved') {
        return res.status(400).json({
          error: 'Already verified',
          message: 'Your seller account is already verified',
        });
      }
      return res.status(400).json({
        error: 'Application pending',
        message: 'You already have a pending verification application',
      });
    }

    // Validate uploaded files - server-side validation for all three documents
    const govIdFrontValidation = await validateUploadedFile(governmentIdFrontKey);
    if (!govIdFrontValidation.isValid) {
      return res.status(400).json({
        error: 'Invalid government ID (front)',
        message: govIdFrontValidation.error,
      });
    }

    const govIdBackValidation = await validateUploadedFile(governmentIdBackKey);
    if (!govIdBackValidation.isValid) {
      return res.status(400).json({
        error: 'Invalid government ID (back)',
        message: govIdBackValidation.error,
      });
    }

    const birValidation = await validateUploadedFile(birDocumentKey);
    if (!birValidation.isValid) {
      return res.status(400).json({
        error: 'Invalid BIR document',
        message: birValidation.error,
      });
    }

    // Calculate checksums for integrity verification
    const govIdFrontChecksum = await getFileChecksum(governmentIdFrontKey);
    const govIdBackChecksum = await getFileChecksum(governmentIdBackKey);
    const birChecksum = await getFileChecksum(birDocumentKey);

    // Create seller application with all three documents
    const application = await SellerApplication.create({
      userId: user._id,
      status: 'pending',
      governmentIdFrontKey,
      governmentIdFrontOriginalName,
      governmentIdFrontSize,
      governmentIdFrontMimeType,
      governmentIdBackKey,
      governmentIdBackOriginalName,
      governmentIdBackSize,
      governmentIdBackMimeType,
      birDocumentKey,
      birDocumentOriginalName,
      birDocumentSize,
      birDocumentMimeType,
      submittedAt: new Date(),
      metadata: {
        govIdFrontChecksum,
        govIdBackChecksum,
        birChecksum,
        submittedFrom: req.headers['user-agent'],
        ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      },
    });

    // Update user sellerStatus to pending
    await User.findByIdAndUpdate(user._id, {
      sellerStatus: 'pending',
    });

    // Create audit log with all three documents
    await AuditLog.create({
      action: 'seller_verification_submitted',
      performedBy: user._id,
      targetType: 'SellerApplication',
      targetId: application._id,
      metadata: {
        governmentIdFrontName: governmentIdFrontOriginalName,
        governmentIdBackName: governmentIdBackOriginalName,
        birDocumentName: birDocumentOriginalName,
        documentsCount: 3,
      },
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json({
      success: true,
      message: 'Verification application submitted successfully',
      application: {
        id: application._id,
        status: application.status,
        submittedAt: application.submittedAt,
      },
    });
  } catch (error: any) {
    console.error('Error submitting verification:', error);
    return res.status(500).json({
      error: 'Failed to submit verification',
      message: error.message || 'An unexpected error occurred',
    });
  }
}

// Apply rate limiting (stricter for submission)
export default rateLimiter(handler, {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // TESTING: Increased limit for development (TODO: reduce to 3 in production)
});
