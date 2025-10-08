import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import jwt from 'jsonwebtoken';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: NextRequest) {
  try {
    // Verify user authentication
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user already has a pending or approved application
    if (user.sellerStatus === 'pending') {
      return NextResponse.json({ error: 'You already have a pending farmer application' }, { status: 400 });
    }

    if (user.sellerStatus === 'verified') {
      return NextResponse.json({ error: 'You are already a verified farmer' }, { status: 400 });
    }

    // Parse form data
    const formData = await req.formData();
    const governmentIdFile = formData.get('governmentId') as File;
    const farmName = formData.get('farmName') as string;
    const farmAddress = formData.get('farmAddress') as string;
    const contactNumber = formData.get('contactNumber') as string;

    if (!governmentIdFile) {
      return NextResponse.json({ error: 'Government ID file is required' }, { status: 400 });
    }

    if (!farmName || !contactNumber) {
      return NextResponse.json({ error: 'Farm name and contact number are required' }, { status: 400 });
    }

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(governmentIdFile.type)) {
      return NextResponse.json({ error: 'Invalid file type. Please upload JPEG, PNG, or PDF' }, { status: 400 });
    }

    if (governmentIdFile.size > 5 * 1024 * 1024) { // 5MB limit
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'farmer-verification');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, that's okay
    }

    // Generate unique filename
    const timestamp = Date.now();
    const userId = user._id.toString();
    const fileExtension = path.extname(governmentIdFile.name);
    const filename = `gov-id-${userId}-${timestamp}${fileExtension}`;
    const filePath = path.join(uploadDir, filename);

    // Save the file
    const bytes = await governmentIdFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create the file URL (relative to public directory)
    const fileUrl = `/uploads/farmer-verification/${filename}`;

    // Update user with farmer verification data
    const updateData = {
      sellerStatus: 'pending',
      farmerVerification: {
        governmentId: {
          filename: filename,
          originalName: governmentIdFile.name,
          fileUrl: fileUrl,
          uploadedAt: new Date(),
          fileSize: governmentIdFile.size,
          mimeType: governmentIdFile.type
        },
        farmDetails: {
          farmName: farmName.trim(),
          farmAddress: farmAddress?.trim() || '',
          contactNumber: contactNumber.trim()
        },
        submittedAt: new Date()
      }
    };

    await User.findByIdAndUpdate(userId, updateData);

    return NextResponse.json({
      message: 'Farmer application submitted successfully',
      status: 'pending'
    });

  } catch (error) {
    console.error('Farmer application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}