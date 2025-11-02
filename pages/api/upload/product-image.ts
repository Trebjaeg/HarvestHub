import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { uploadToSpaces } from '@/lib/digitalocean-spaces';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get token from cookies
    const token = req.cookies['auth-token'] || req.cookies.userToken || req.cookies.hh_token;
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId || decoded.id;

    // Parse the uploaded file
    const form = formidable({
      keepExtensions: true,
      maxFileSize: 60 * 1024 * 1024, // 60MB server-side parser limit
    });

    const [fields, files] = await form.parse(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    // Validate file type - be very permissive for mobile uploads
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    const lowerName = (file.originalFilename || '').toLowerCase();
    const looksLikeImage = lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || 
                           lowerName.endsWith('.png') || lowerName.endsWith('.webp') ||
                           lowerName.endsWith('.heic') || lowerName.endsWith('.heif');
    const mimeType = file.mimetype || '';
    const looksLikeImageMime = mimeType.startsWith('image/') || mimeType === '';
    
    // Accept if: 1) mimetype is in allowed list, 2) extension looks like image, 3) mimetype starts with image/
    if (!(allowedTypes.includes(mimeType) || (looksLikeImage && looksLikeImageMime))) {
      console.error('File validation failed:', { 
        mimetype: file.mimetype, 
        filename: file.originalFilename,
        size: file.size 
      });
      return res.status(400).json({ 
        message: `Invalid file type. Got: ${file.mimetype || 'unknown'}. File: ${file.originalFilename}`,
        error: 'FILE_TYPE_NOT_ALLOWED'
      });
    }

    // Read file buffer
    const fileBuffer = fs.readFileSync(file.filepath);
    
    // Generate unique filename
    const folder = Array.isArray(fields.folder) ? fields.folder[0] : fields.folder || 'products';
    const timestamp = Date.now();
    const extension = file.originalFilename?.split('.').pop() || 'jpg';
    const fileName = `${timestamp}-${userId}.${extension}`;

    // Upload to DigitalOcean Spaces
    const url = await uploadToSpaces(
      fileBuffer, 
      fileName, 
      file.mimetype || 'image/jpeg',
      folder
    );

    // Clean up temp file
    try {
      fs.unlinkSync(file.filepath);
    } catch (e) {
      // Ignore cleanup errors
    }

    return res.status(200).json({
      success: true,
      url
    });

  } catch (error: any) {
    return res.status(500).json({
      message: 'Upload failed',
      error: error.message
    });
  }
}
