import { NextApiRequest, NextApiResponse } from 'next';
import formidable, { IncomingForm, File } from 'formidable';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { uploadToSpaces } from '../../../lib/digitalocean-spaces';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Get token from Authorization header or cookie
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || req.cookies['auth-token'] || req.cookies['hh_token'];

    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    // Verify JWT token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    } catch (error) {
      console.error('JWT verification failed:', error);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Verify buyer exists and has buyer role
    const buyer = await User.findById(decoded.userId);
    if (!buyer || buyer.role !== 'buyer') {
      return res.status(403).json({ error: 'Access denied. Buyer role required.' });
    }

    // Parse form data
    const form = new IncomingForm({
      maxFileSize: 5 * 1024 * 1024, // 5MB
      keepExtensions: true,
    });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;
    
    if (!imageFile) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Upload to DigitalOcean Spaces
    // Read file buffer
    const filePath = (imageFile as any).filepath || (imageFile as any).path;
    const buffer = fs.readFileSync(filePath);
    const imageUrl = await uploadToSpaces(buffer, (imageFile as any).originalFilename || `profile-${Date.now()}`, (imageFile as any).mimetype || 'image/jpeg', 'buyer-profiles');

    // Update buyer profile with new image URL
    buyer.profileImage = imageUrl;
    await buyer.save();

    // Clean up uploaded file
    if (imageFile && 'filepath' in imageFile) {
      fs.unlinkSync(imageFile.filepath);
    }

    return res.status(200).json({
      success: true,
      message: 'Profile image updated successfully',
      profileImage: imageUrl
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    return res.status(500).json({ error: 'Failed to upload profile image' });
  }
}
