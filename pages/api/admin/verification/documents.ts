import { NextApiRequest, NextApiResponse } from 'next';
import { generatePresignedDownloadUrl } from '@/lib/digitalocean-upload';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import SellerApplication from '@/models/SellerApplication';
import dbConnect from '@/lib/mongodb';

interface DecodedToken {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

/**
 * GET /api/admin/verification/documents?applicationId=xxx&documentType=government_id|bir_document
 * Generate short-lived signed URL for viewing verification documents
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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { applicationId, documentType } = req.query;

    // Validate required fields
    if (!applicationId || !documentType) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'applicationId and documentType are required',
      });
    }

    // If documentType is 'all', return all three documents
    if (documentType === 'all') {
      // Get application
      const application = await SellerApplication.findById(applicationId);

      if (!application) {
        return res.status(404).json({
          error: 'Application not found',
          message: 'The specified application does not exist',
        });
      }

      // Generate signed URLs for all three documents
      const [govIdFrontUrl, govIdBackUrl, birUrl] = await Promise.all([
        generatePresignedDownloadUrl(application.governmentIdFrontKey, 300),
        generatePresignedDownloadUrl(application.governmentIdBackKey, 300),
        generatePresignedDownloadUrl(application.birDocumentKey, 300),
      ]);

      return res.status(200).json({
        success: true,
        documents: {
          governmentIdFront: {
            url: govIdFrontUrl,
            originalName: application.governmentIdFrontOriginalName,
            size: application.governmentIdFrontSize,
            mimeType: application.governmentIdFrontMimeType,
          },
          governmentIdBack: {
            url: govIdBackUrl,
            originalName: application.governmentIdBackOriginalName,
            size: application.governmentIdBackSize,
            mimeType: application.governmentIdBackMimeType,
          },
          birDocument: {
            url: birUrl,
            originalName: application.birDocumentOriginalName,
            size: application.birDocumentSize,
            mimeType: application.birDocumentMimeType,
          },
        },
      });
    }

    // Single document type request (backward compatibility)
    if (!['government_id_front', 'government_id_back', 'bir_document'].includes(documentType as string)) {
      return res.status(400).json({
        error: 'Invalid document type',
        message: 'documentType must be government_id_front, government_id_back, bir_document, or all',
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

    // Get document key based on type
    let key: string;
    let originalName: string;
    
    if (documentType === 'government_id_front') {
      key = application.governmentIdFrontKey;
      originalName = application.governmentIdFrontOriginalName;
    } else if (documentType === 'government_id_back') {
      key = application.governmentIdBackKey;
      originalName = application.governmentIdBackOriginalName;
    } else {
      key = application.birDocumentKey;
      originalName = application.birDocumentOriginalName;
    }

    // Generate short-lived signed URL (5 minutes)
    const downloadUrl = await generatePresignedDownloadUrl(key, 300);

    return res.status(200).json({
      success: true,
      downloadUrl,
      originalName,
      expiresIn: 300, // 5 minutes
    });
  } catch (error: any) {
    console.error('Error generating document URL:', error);
    return res.status(500).json({
      error: 'Failed to generate document URL',
      message: error.message || 'An unexpected error occurred',
    });
  }
}

export default handler;
