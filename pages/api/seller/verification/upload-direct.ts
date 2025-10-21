import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File } from 'formidable';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';
import { uploadToSpaces } from '@/lib/digitalocean-spaces';

interface DecodedToken {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// Disable default body parser to handle multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * POST /api/seller/verification/upload-direct
 * Upload verification documents directly through the backend
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

    // Parse multipart form data
    const form = new IncomingForm({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: true,
    });

    const { fields, files } = await new Promise<{ fields: any; files: any }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const documentType = Array.isArray(fields.documentType) ? fields.documentType[0] : fields.documentType;
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file || !documentType) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'file and documentType are required',
      });
    }

    // Validate document type
    if (!['government_id_front', 'government_id_back', 'bir_document'].includes(documentType)) {
      return res.status(400).json({
        error: 'Invalid document type',
        message: 'documentType must be government_id_front, government_id_back, or bir_document',
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype || '')) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Only JPEG, PNG, WEBP images and PDF files are allowed',
      });
    }

    // Read file buffer
    const fileBuffer = fs.readFileSync(file.filepath);

    // Upload to Spaces
    const folder = `verification-documents/${user._id}/${documentType}`;
    const fileName = `${Date.now()}-${file.originalFilename || 'document'}`;
    
    const uploadUrl = await uploadToSpaces(
      fileBuffer,
      fileName,
      file.mimetype || 'application/octet-stream',
      folder
    );

    // Clean up temp file
    fs.unlinkSync(file.filepath);

    // Generate the key (path in Spaces)
    const key = `${folder}/${fileName}`;

    return res.status(200).json({
      success: true,
      key,
      url: uploadUrl,
      fileName: file.originalFilename,
      size: file.size,
      mimeType: file.mimetype,
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return res.status(500).json({
      error: 'Failed to upload file',
      message: error.message || 'An unexpected error occurred',
    });
  }
}

export default handler;
