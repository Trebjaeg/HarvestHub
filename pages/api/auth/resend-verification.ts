import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { withSecurity, withLogging } from '@/lib/middleware';
import { sanitizeInput } from '@/lib/security';
import emailService from '@/lib/email-service';

async function resendVerificationHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  let { email } = req.body;

  if (!email) {
    return res.status(400).json({ 
      success: false,
      message: 'Email is required' 
    });
  }

  // Sanitize and validate email
  email = sanitizeInput(email).toLowerCase();
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid email format' 
    });
  }

  try {
    await dbConnect();
    
    const user = await User.findOne({ email });

    // Always return success to prevent user enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If that account exists and is not verified, a verification email was sent.'
      });
    }

    // If already verified, don't send email
    if (user.isVerified) {
      return res.status(200).json({
        success: true,
        message: 'This account is already verified.'
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = verificationTokenExpires;
    await user.save();

    // Send verification email
    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify?token=${verificationToken}`;
    
    const emailSent = await emailService.sendEmailVerification(
      email, 
      verificationUrl, 
      user.name
    );

    if (!emailSent) {
      console.error('Failed to send verification email to:', email);
    }

    return res.status(200).json({
      success: true,
      message: 'If that account exists and is not verified, a verification email was sent.'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send verification email. Please try again.'
    });
  }
}

export default withSecurity(
  withLogging(resendVerificationHandler),
  {
    rateLimit: 'passwordReset', // Reuse password reset rate limit
    allowedMethods: ['POST'],
    cors: true
  }
);