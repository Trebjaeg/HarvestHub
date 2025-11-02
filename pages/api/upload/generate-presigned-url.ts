import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { s3, BUCKET_NAME } from '@/lib/digitalocean-spaces';

/**
 * Generate pre-signed URL for direct upload to DigitalOcean Spaces
 * Client uploads directly to Spaces, bypassing Next.js body size limits
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authentication check
    const token = req.cookies['auth-token'] || req.cookies.userToken || req.cookies.hh_token;
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please log in to upload images' 
      });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (jwtError) {
      return res.status(401).json({ 
        error: 'Invalid authentication',
        message: 'Your session has expired. Please log in again.' 
      });
    }

    const { fileName, contentType, folder = 'products' } = req.body;

    if (!fileName || !contentType) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'fileName and contentType are required'
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(contentType)) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Only JPEG, PNG, and WEBP images are allowed'
      });
    }

    // Generate unique key
    const timestamp = Date.now();
    const extension = fileName.split('.').pop() || 'jpg';
    const key = `${folder}/${timestamp}-${decoded.userId}.${extension}`;

    // Generate pre-signed URL for PUT operation (120 second expiry for large files)
    const signedUrl = s3.getSignedUrl('putObject', {
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      ACL: 'public-read',
      Expires: 120, // URL valid for 2 minutes (enough for large uploads)
    });

    // Return the pre-signed URL and the final CDN URL
    const cdnUrl = `${process.env.DO_SPACES_CDN_URL || `https://${BUCKET_NAME}.nyc3.cdn.digitaloceanspaces.com`}/${key}`;

    return res.status(200).json({
      success: true,
      uploadUrl: signedUrl, // Client uploads to this URL
      fileUrl: cdnUrl, // This is the final URL to save in database
      key,
      expiresIn: 120
    });

  } catch (error: any) {
    console.error('Error generating pre-signed URL:', error);
    
    return res.status(500).json({
      error: 'Failed to generate upload URL',
      message: error.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
