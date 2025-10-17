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

    // Check if user exists - don't send email to non-existent accounts
    if (!user) {
      // Return error to inform user that account doesn't exist
      return res.status(404).json({ 
        success: false,
        message: 'No account found with this email address.' 
      });
    }

    // Generate secure 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
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
      // If email fails, still return success to user but log the error
      console.error('Failed to send password reset email:', emailError);
    }

    return res.status(200).json({ 
      success: true,
      message: 'Password reset code sent to your email.' 
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
