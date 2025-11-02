import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-api';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { uploadToSpaces, deleteFromSpaces } from '@/lib/digitalocean-spaces';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Increase body size limit to 50MB
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * POST /api/buyer/upload-profile-image
 * Upload and update buyer profile picture
 * Supports up to 50MB, JPEG/PNG/WEBP formats
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    const userId = user.id;

    console.log(`[UPLOAD] User ${userId} starting profile image upload`);

    // Get form data
    const formData = await request.formData();
    const file = formData.get('profileImage') as File;

    if (!file) {
      console.error('[UPLOAD] No file provided in request');
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    console.log(`[UPLOAD] File received: ${file.name}, size: ${(file.size / 1024 / 1024).toFixed(2)}MB, type: ${file.type}`);

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      console.error(`[UPLOAD] Invalid file type: ${file.type}`);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid file type. Only JPEG, PNG, and WEBP images are allowed.' 
        },
        { status: 415 } // Unsupported Media Type
      );
    }

    // Validate file size (50 MB limit)
    if (file.size > MAX_FILE_SIZE) {
      console.error(`[UPLOAD] File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return NextResponse.json(
        { 
          success: false, 
          message: `File size exceeds 50MB limit. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB` 
        },
        { status: 413 } // Payload Too Large
      );
    }

    await dbConnect();

    // Get current user to check for existing profile image
    const userDoc = await User.findById(userId);
    if (!userDoc) {
      console.error(`[UPLOAD] User not found: ${userId}`);
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log(`[UPLOAD] Processing image...`);

    // Process image with sharp - resize and optimize
    // Preserve EXIF orientation by using rotate()
    const processedImage = await sharp(buffer)
      .rotate() // Auto-rotate based on EXIF orientation
      .resize(500, 500, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    console.log(`[UPLOAD] Image processed. Original: ${(buffer.length / 1024).toFixed(2)}KB, Processed: ${(processedImage.length / 1024).toFixed(2)}KB`);

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `profile-${userId}-${timestamp}.jpg`;

    console.log(`[UPLOAD] Uploading to storage: ${fileName}`);

    // Upload to DigitalOcean Spaces
    const imageUrl = await uploadToSpaces(
      processedImage,
      fileName,
      'image/jpeg',
      'profile-pictures'
    );

    console.log(`[UPLOAD] Upload successful: ${imageUrl}`);

    // Delete old profile image if exists
    if (userDoc.profilePicture || userDoc.profileImage) {
      try {
        const oldImageUrl = userDoc.profilePicture || userDoc.profileImage;
        if (oldImageUrl && oldImageUrl.includes('profile-')) {
          console.log(`[UPLOAD] Deleting old image: ${oldImageUrl}`);
          await deleteFromSpaces(oldImageUrl);
        }
      } catch (error) {
        console.error('[UPLOAD] Error deleting old profile image:', error);
        // Continue even if deletion fails
      }
    }

    // Update user profile with new image URL - atomic update
    await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          profilePicture: imageUrl,
          profileImage: imageUrl
        }
      },
      { new: true }
    );

    console.log(`[UPLOAD] User profile updated successfully`);

    return NextResponse.json({
      success: true,
      message: 'Profile picture updated successfully',
      imageUrl: imageUrl,
    });

  } catch (error) {
    console.error('[UPLOAD] Error uploading profile image:', error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes('authentication')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in again.' },
        { status: 401 }
      );
    }

    // Handle Sharp processing errors
    if (error instanceof Error && error.message.includes('sharp')) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to process image. Please try a different file.' 
        },
        { status: 422 }
      );
    }

    // Handle storage errors
    if (error instanceof Error && error.message.includes('storage')) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to upload to storage. Please try again.' 
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to upload profile image. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
