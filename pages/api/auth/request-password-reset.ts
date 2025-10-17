import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { withSecurity, withLogging } from '@/lib/middleware';
import { sanitizeInput, generateSecureToken, hashToken } from '@/lib/security';
import { sendPasswordResetEmail } from '@/lib/email-service-sendgrid';

async function passwordResetHandler(req: NextApiRequest, res: NextApiResponse) {
  let { email } = req.body || {};
  
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  // Sanitize and validate email
  email = sanitizeInput(email).toLowerCase();
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  try {
    await dbConnect();
    
    const user = await User.findOne({ email }).exec();

    // Always respond with success to prevent user enumeration
    if (!user) {
      return res.status(200).json({ 
        success: true,
        message: 'If that account exists, a reset link was sent.' 
      });
    }

    // Generate secure 4-digit verification code
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const codeHash = hashToken(verificationCode);
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Update user with verification code
    user.resetPasswordToken = codeHash;
    user.resetPasswordExpires = expires;
    await user.save();

    // Send password reset email with timeout
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Email timeout')), 8000);
      });

      const emailPromise = sendPasswordResetEmail(email, verificationCode);
      await Promise.race([emailPromise, timeoutPromise]);
    } catch (emailError) {
    }

    return res.status(200).json({ 
      success: true,
      message: 'If that account exists, a reset link was sent.' 
    });
    
  } catch (err: any) {
    console.error('Password reset error:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Unable to process request. Please try again later.' 
    });
  }
}

// Apply security middleware with rate limiting specific to password reset
export default withSecurity(
  withLogging(passwordResetHandler),
  {
    rateLimit: 'passwordReset',
    allowedMethods: ['POST'],
    cors: true
  }
);
