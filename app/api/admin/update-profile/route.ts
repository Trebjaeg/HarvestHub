import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JWTPayload {
  userId: string;
  email: string;
}

export async function PUT(req: NextRequest) {
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

    const { firstName, lastName, phone, profileImage } = await req.json();

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

    // Validation
    if (firstName && !/^[a-zA-Z\s]+$/.test(firstName.trim())) {
      return NextResponse.json(
        { message: 'First name should only contain letters and spaces' },
        { status: 400 }
      );
    }

    if (lastName && !/^[a-zA-Z\s]+$/.test(lastName.trim())) {
      return NextResponse.json(
        { message: 'Last name should only contain letters and spaces' },
        { status: 400 }
      );
    }

    if (phone && !/^\d{11}$/.test(phone.replace(/\s/g, ''))) {
      return NextResponse.json(
        { message: 'Phone number must be exactly 11 digits' },
        { status: 400 }
      );
    }

    // Update profile fields
    if (firstName) user.firstName = firstName.trim();
    if (lastName) user.lastName = lastName.trim();
    if (phone !== undefined) user.phone = phone;
    if (profileImage !== undefined) user.profileImage = profileImage;

    // Update the name field (combination of first and last name)
    if (firstName || lastName) {
      user.name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }

    await user.save();

    return NextResponse.json(
      {
        message: 'Profile updated successfully',
        admin: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          profileImage: user.profileImage,
          role: user.role
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating admin profile:', error);
    return NextResponse.json(
      { message: 'An error occurred while updating profile' },
      { status: 500 }
    );
  }
}
