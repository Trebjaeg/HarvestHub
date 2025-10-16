import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { withSecurity, withLogging } from '@/lib/middleware';
import { sanitizeInput, generateSecureToken, hashToken } from '@/lib/security';
import emailService from '@/lib/email-service';

async function passwordResetHandler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== PASSWORD RESET REQUEST START ===');
  console.log('Method:', req.method);
  console.log('Request body:', req.body);
  console.log('Headers:', req.headers);
  
  let { email } = req.body || {};
  
  if (!email) {
    console.log('ERROR: No email provided');
    return res.status(400).json({ message: 'Email is required' });
  }

  // Sanitize and validate email
  email = sanitizeInput(email).toLowerCase();
  console.log('Processing email:', email);
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.log('ERROR: Invalid email format:', email);
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
    console.log('Generated verification code:', verificationCode);
    console.log('Code type:', typeof verificationCode, 'Code length:', verificationCode.length);
    
    const codeHash = hashToken(verificationCode);
    console.log('Generated code hash:', codeHash);
    
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    console.log('Code expires at:', expires);

    // Update user with verification code
    user.resetPasswordToken = codeHash;
    user.resetPasswordExpires = expires;
    await user.save();

    // Send password reset email with timeout to prevent hanging
    console.log('Attempting to send password reset email to:', email);
    
    try {
      // Create timeout promise (8 seconds)
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => {
          console.warn('[PASSWORD_RESET] Email timeout - responding anyway');
          resolve(false);
        }, 8000);
      });

      // Race between email sending and timeout
      const emailPromise = emailService.sendPasswordResetCode(email, verificationCode, user.name);
      const emailSent = await Promise.race([emailPromise, timeoutPromise]);
      console.log('Email send result:', emailSent);
      
      if (!emailSent) {
        console.error('Failed to send password reset email to:', email);
        console.log('🔑 PASSWORD RESET CODE FOR TESTING:', verificationCode); // Show code in console
        console.warn('Email service may not be configured. Check server logs for the code.');
        // Still return success to prevent user enumeration, but log the error
      } else {
        console.log('Password reset email sent successfully to:', email);
        console.log('🔑 PASSWORD RESET CODE FOR TESTING:', verificationCode); // Show code in console for testing
      }
    } catch (emailError) {
      console.error('[PASSWORD_RESET] Email service error:', emailError);
      console.log('🔑 PASSWORD RESET CODE FOR TESTING:', verificationCode);
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
