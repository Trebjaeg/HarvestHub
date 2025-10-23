import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import sendEmail from '@/lib/email-service';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JWTPayload {
  userId: string;
  email: string;
}

// Generate a random 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
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

    const { newEmail } = await req.json();

    if (!newEmail || !newEmail.trim()) {
      return NextResponse.json(
        { message: 'New email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
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

    // Check if new email is already in use
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser && existingUser._id.toString() !== decoded.userId) {
      return NextResponse.json(
        { message: 'Email already in use' },
        { status: 400 }
      );
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store verification code in user document
    user.emailChangeVerification = {
      code: verificationCode,
      newEmail: newEmail,
      expiresAt: expiresAt
    };
    await user.save();

    // Send verification email
    const emailSubject = 'Email Change Verification Code - HarvestHub';
    const emailBody = `
      <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #103C2E 0%, #1a5c42 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Email Change Verification</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hello ${user.firstName || 'Admin'},</p>
          
          <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
            You have requested to change your email address from <strong>${user.email}</strong> to <strong>${newEmail}</strong>.
          </p>
          
          <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
            Please use the verification code below to confirm this change:
          </p>
          
          <div style="background: #f5f5f5; border-left: 4px solid #103C2E; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="font-size: 12px; color: #666; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Verification Code</p>
            <p style="font-size: 32px; font-weight: bold; color: #103C2E; margin: 0; letter-spacing: 5px; font-family: 'Courier New', monospace;">
              ${verificationCode}
            </p>
          </div>
          
          <p style="font-size: 14px; color: #666; margin: 20px 0;">
            <strong>Important:</strong> This code will expire in 10 minutes. If you did not request this change, please ignore this email or contact support immediately.
          </p>
          
          <div style="background: #fff8e1; border: 1px solid #ffd54f; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="font-size: 13px; color: #856404; margin: 0;">
              ⚠️ For security reasons, do not share this code with anyone. HarvestHub staff will never ask for your verification code.
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;" />
          
          <p style="font-size: 12px; color: #999; margin: 0;">
            If you need assistance, please contact us at 
            <a href="mailto:support@harvesthubph.app" style="color: #103C2E; text-decoration: none;">support@harvesthubph.app</a>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; padding: 20px;">
          <p style="font-size: 12px; color: #999; margin: 5px 0;">
            © ${new Date().getFullYear()} HarvestHub. All rights reserved.
          </p>
          <p style="font-size: 11px; color: #bbb; margin: 5px 0;">
            This is an automated message, please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    await sendEmail.sendEmail({
      to: newEmail,
      subject: emailSubject,
      html: emailBody
    });

    return NextResponse.json(
      { 
        message: 'Verification code sent to your new email address',
        expiresIn: 600 // 10 minutes in seconds
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error requesting email change:', error);
    return NextResponse.json(
      { message: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
