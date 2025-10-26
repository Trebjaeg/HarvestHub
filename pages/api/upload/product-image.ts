import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { uploadToSpaces } from '@/lib/digitalocean-spaces';

// Disable default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

interface DecodedToken {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authentication check
    const token = req.cookies['auth-token'] || req.cookies.userToken || req.cookies.hh_token;
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;

    // Parse form data
    const form = formidable({
      maxFileSize: 35 * 1024 * 1024, // 35MB (will be compressed and uploaded to Spaces in KB)
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype || '')) {
      return res.status(400).json({ 
        error: 'Invalid file type',
        message: 'Only JPEG, PNG, and WEBP images are allowed'
      });
    }

    // Read file buffer
    const fileBuffer = fs.readFileSync(file.filepath);

    // Generate unique filename
    const folder = Array.isArray(fields.folder) ? fields.folder[0] : fields.folder;
    const timestamp = Date.now();
    const extension = file.originalFilename?.split('.').pop() || 'jpg';
    const fileName = `${timestamp}-${decoded.userId}.${extension}`;

    // Upload to DigitalOcean Spaces
    const url = await uploadToSpaces(
      fileBuffer,
      fileName,
      file.mimetype || 'image/jpeg',
      folder || 'products'
    );

    // Clean up temp file
    fs.unlinkSync(file.filepath);

    return res.status(200).json({
      success: true,
      url,
      fileName,
      size: file.size,
      mimeType: file.mimetype
    });

  } catch (error: any) {
    console.error('Error uploading product image:', error);
    return res.status(500).json({
      error: 'Upload failed',
      message: error.message || 'An unexpected error occurred'
    });
  }
}

export default handler;
