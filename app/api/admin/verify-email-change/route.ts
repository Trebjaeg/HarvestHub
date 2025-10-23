import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';

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

    const { verificationCode } = await req.json();

    if (!verificationCode || !verificationCode.trim()) {
      return NextResponse.json(
        { message: 'Verification code is required' },
        { status: 400 }
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

    // Check if email change verification exists
    if (!user.emailChangeVerification || !user.emailChangeVerification.code) {
      return NextResponse.json(
        { message: 'No email change request found' },
        { status: 400 }
      );
    }

    // Check if code has expired
    if (!user.emailChangeVerification.expiresAt || new Date() > user.emailChangeVerification.expiresAt) {
      // Clean up expired verification
      user.emailChangeVerification = undefined;
      await user.save();

      return NextResponse.json(
        { message: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify the code
    if (user.emailChangeVerification.code !== verificationCode.trim()) {
      return NextResponse.json(
        { message: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Store old email for audit log
    const oldEmail = user.email;
    const newEmail = user.emailChangeVerification.newEmail || '';

    if (!newEmail) {
      return NextResponse.json(
        { message: 'Invalid email change request' },
        { status: 400 }
      );
    }

    // Update email
    user.email = newEmail;
    user.emailChangeVerification = undefined; // Clear verification data
    await user.save();

    // Create audit log
    try {
      await AuditLog.create({
        userId: user._id,
        action: 'email_changed',
        details: {
          oldEmail: oldEmail,
          newEmail: newEmail,
          changedBy: user._id,
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown'
        },
        performedBy: user._id,
        targetUser: user._id,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown'
      });
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
      // Don't fail the request if audit log fails
    }

    // Generate new JWT token with updated email
    const newToken = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set new token in cookie
    const response = NextResponse.json(
      { 
        message: 'Email updated successfully',
        email: newEmail
      },
      { status: 200 }
    );

    response.cookies.set('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;

  } catch (error) {
    console.error('Error verifying email change:', error);
    return NextResponse.json(
      { message: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
