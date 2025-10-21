import { NextApiRequest, NextApiResponse } from 'next';
import { generatePresignedUploadUrl } from '@/lib/digitalocean-upload';
import { rateLimiter } from '@/lib/rate-limiter';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

interface UploadRequest {
  fileName: string;
  contentType: string;
  documentType: 'government_id_front' | 'government_id_back' | 'bir_document';
}

interface DecodedToken {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

/**
 * POST /api/seller/verification/upload-url
 * Generate pre-signed URL for document upload
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

    // Store user in request for use in handler
    (req as any).user = user;
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, contentType, documentType }: UploadRequest = req.body;

    // Validate required fields
    if (!fileName || !contentType || !documentType) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'fileName, contentType, and documentType are required',
      });
    }

    // Validate document type
    if (!['government_id_front', 'government_id_back', 'bir_document'].includes(documentType)) {
      return res.status(400).json({
        error: 'Invalid document type',
        message: 'documentType must be government_id_front, government_id_back, or bir_document',
      });
    }

    // Validate content type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(contentType)) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Only JPEG, PNG, WEBP images and PDF files are allowed',
      });
    }

    // Generate pre-signed URL
    const folder = `verification-documents/${documentType}`;
    const { uploadUrl, key } = await generatePresignedUploadUrl(
      fileName,
      contentType,
      folder
    );

    return res.status(200).json({
      success: true,
      uploadUrl,
      key,
      expiresIn: 300, // 5 minutes
    });
  } catch (error: any) {
    console.error('Error generating upload URL:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      error: 'Failed to generate upload URL',
      message: error.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

// Apply rate limiting
export default rateLimiter(handler, {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
});
