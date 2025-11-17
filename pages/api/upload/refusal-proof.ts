import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import formidable from 'formidable';
import { uploadToSpaces } from '@/lib/digitalocean-spaces';
import fs from 'fs';

// Disable body parsing for multipart form data
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * POST /api/upload/refusal-proof
 * Upload proof/documentation for refusing delivery
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Extract seller ID from token
    const token = 
      req.cookies.token || 
      req.cookies['auth-token'] || 
      req.cookies['hh_token'] ||
      req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET!);
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ message: 'Unauthorized - Invalid token' });
    }

    // Parse the multipart form data
    const form = formidable({
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB limit
    });

    const [fields, files] = await form.parse(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    const orderId = Array.isArray(fields.orderId) ? fields.orderId[0] : fields.orderId;

    if (!file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file provided' 
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype || '')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid file type. Only images and PDFs are allowed' 
      });
    }

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ 
        success: false, 
        message: 'File size exceeds 5MB limit' 
      });
    }

    // Read file buffer
    const fileBuffer = fs.readFileSync(file.filepath);

    // Upload to DigitalOcean Spaces
    const timestamp = Date.now();
    const fileName = `refusal-proof/${orderId}/${timestamp}-${file.originalFilename}`;
    
    const fileUrl = await uploadToSpaces(fileBuffer, fileName, file.mimetype || 'application/octet-stream');

    // Clean up temporary file
    fs.unlinkSync(file.filepath);

    return res.status(200).json({
      success: true,
      fileUrl,
      fileName: file.originalFilename
    });

  } catch (error) {
    console.error('❌ Error uploading refusal proof:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to upload file',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
