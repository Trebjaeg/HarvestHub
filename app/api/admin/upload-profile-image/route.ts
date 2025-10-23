import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { uploadToSpaces } from '@/lib/digitalocean-spaces';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JWTPayload {
  userId: string;
  email: string;
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // Get token from cookies
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify JWT token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if user exists and is admin/superadmin
    const user = await User.findById(decoded.userId);

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return NextResponse.json(
        { message: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('profileImage') as File;

    if (!file) {
      return NextResponse.json(
        { message: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { message: 'Invalid file type. Please upload an image.' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { message: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to DigitalOcean Spaces
    const fileName = `admin-profiles/${user._id}-${Date.now()}.${file.name.split('.').pop()}`;
    const imageUrl = await uploadToSpaces(buffer, fileName, file.type);

    // Update user profile image
    user.profileImage = imageUrl;
    await user.save();

    return NextResponse.json(
      {
        message: 'Profile image uploaded successfully',
        imageUrl: imageUrl
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error uploading admin profile image:', error);
    return NextResponse.json(
      { message: 'An error occurred while uploading the image' },
      { status: 500 }
    );
  }
}
