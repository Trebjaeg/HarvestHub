import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { withSecurity, withLogging } from '@/lib/middleware';
import { sanitizeInput } from '@/lib/security';

async function verifyEmailHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ 
      success: false,
      message: 'Verification token is required' 
    });
  }

  try {
    await dbConnect();
    
    const sanitizedToken = sanitizeInput(token);
    
    // Find user with valid verification token
    const user = await User.findOne({
      verificationToken: sanitizedToken,
      verificationTokenExpires: { $gt: new Date() },
      isVerified: false
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Mark user as verified and clear verification token
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    user.updatedAt = new Date();
    
    await user.save();

    // Return success response with redirect info
    return res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now log in.',
      redirect: '/verify?success=true'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify email. Please try again.'
    });
  }
}

export default withSecurity(
  withLogging(verifyEmailHandler),
  {
    rateLimit: 'general',
    allowedMethods: ['GET'],
    cors: true
  }
);