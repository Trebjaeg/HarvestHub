import { NextRequest, NextResponse } from 'next/server';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { uploadToSpaces, deleteFromSpaces } from '../../../lib/digitalocean-spaces';

// Disable body parsing for formidable
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get token from header
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    const form = new IncomingForm({
      keepExtensions: true,
      maxFileSize: 35 * 1024 * 1024, // 35MB (will be compressed and uploaded to Spaces in KB)
      maxFiles: 5,
    });

    const [fields, files] = await form.parse(req);

    const uploadedFiles: string[] = [];
    
    if (files.images) {
      const imageFiles = Array.isArray(files.images) ? files.images : [files.images];
      
      for (const file of imageFiles) {
        if (file && file.filepath) {
          // Validate file type
          const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
          if (!allowedTypes.includes(file.mimetype || '')) {
            // Clean up temporary file
            fs.unlinkSync(file.filepath);
            continue; // Skip invalid files
          }

          // Read file buffer
          const fileBuffer = fs.readFileSync(file.filepath);
          
          // Generate unique filename
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(2);
          const extension = path.extname(file.originalFilename || '');
          const filename = `product_${decoded.userId}_${timestamp}_${randomStr}${extension}`;

          try {
            // Upload to DigitalOcean Spaces
            const imageUrl = await uploadToSpaces(
              fileBuffer,
              filename,
              file.mimetype || 'image/jpeg',
              'products'
            );

            uploadedFiles.push(imageUrl);
          } catch (uploadError) {
            console.error('Error uploading to Spaces:', uploadError);
            // Continue with other files even if one fails
          }

          // Clean up temporary file
          fs.unlinkSync(file.filepath);
        }
      }
    }

    if (uploadedFiles.length === 0) {
      return res.status(400).json({ error: 'No valid images uploaded' });
    }

    return res.status(200).json({
      message: 'Images uploaded successfully',
      images: uploadedFiles
    });

  } catch (error) {
    console.error('Error uploading images:', error);
    return res.status(500).json({ error: 'Failed to upload images' });
  }
}