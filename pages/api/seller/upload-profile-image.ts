import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { uploadToSpaces, deleteFromSpaces } from '@/lib/digitalocean-spaces';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Disable Next.js body parser for this route
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
    await dbConnect();

    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Fallback to cookies (check all possible cookie names)
    if (!token) {
      token = req.cookies['auth-token'] || req.cookies.token || req.cookies.userToken;
    }

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId || decoded.id;

    // Parse the uploaded file
    const form = formidable({
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB limit
    });

    const [fields, files] = await form.parse(req);
    const profileImage = Array.isArray(files.profileImage) ? files.profileImage[0] : files.profileImage;

    if (!profileImage) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(profileImage.mimetype || '')) {
      return res.status(400).json({ message: 'Invalid file type. Only images are allowed.' });
    }

    // Read file buffer
    const fileBuffer = fs.readFileSync(profileImage.filepath);
    
    // Generate unique filename
    const fileExtension = path.extname(profileImage.originalFilename || '');
    const fileName = `profile_${userId}_${Date.now()}${fileExtension}`;

    // Upload to DigitalOcean Spaces
    const imageUrl = await uploadToSpaces(
      fileBuffer, 
      fileName, 
      profileImage.mimetype || 'image/jpeg',
      'profiles'
    );

    // Get current user to delete old profile image if exists
    const currentUser = await User.findById(userId);
    const oldProfileImage = currentUser?.profileImage;

    // Update user's profile image in database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profileImage: imageUrl },
      { new: true }
    );

    if (!updatedUser) {
      // If user update fails, delete the uploaded image
      await deleteFromSpaces(imageUrl);
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete old profile image from Spaces if it exists
    if (oldProfileImage && oldProfileImage !== imageUrl) {
      try {
        await deleteFromSpaces(oldProfileImage);
      } catch (error) {
        console.error('Error deleting old profile image:', error);
        // Don't fail the request if old image deletion fails
      }
    }

    // Clean up temporary file
    fs.unlinkSync(profileImage.filepath);

    return res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      imageUrl: imageUrl
    });

  } catch (error) {
    console.error('Error uploading profile image:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}