import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { withSecurity, withLogging } from '@/lib/middleware';
import { sanitizeInput, hashToken } from '@/lib/security';

async function verifyResetCodeHandler(req: NextApiRequest, res: NextApiResponse) {
  let { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ 
      message: 'Email and verification code are required',
      success: false 
    });
  }

  // Sanitize inputs
  email = sanitizeInput(email).toLowerCase();
  code = sanitizeInput(code);

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ 
      message: 'Invalid email format',
      success: false 
    });
  }

  // Validate code format (6 digits)
  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({ 
      message: 'Invalid verification code format. Code must be 6 digits.',
      success: false 
    });
  }

  try {
    await dbConnect();
    
    const codeHash = hashToken(code);
    
    const user = await User.findOne({ 
      email, 
      resetPasswordToken: codeHash, 
      resetPasswordExpires: { $gt: new Date() } 
    }).exec();
    
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired verification code. Please request a new password reset.' 
      });
    }

    // Code is valid - Generate JWT token for password reset authorization
    const resetToken = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        purpose: 'password_reset',
        codeUsed: codeHash // Bind to specific code
      },
      process.env.JWT_SECRET!,
      { 
        expiresIn: '10m', // 10 minutes to complete password reset
        issuer: 'harvesthub-ph',
        audience: 'password-reset'
      }
    );

    // Clear the verification code since it's been used (single-use security)
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({ 
      success: true,
      message: 'Verification code is valid. You can now reset your password.',
      resetToken // Return JWT token for password reset
    });
    
  } catch (err: any) {
    console.error('Code verification error:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Unable to verify code. Please try again later.' 
    });
  }
}

// Apply security middleware with rate limiting
export default withSecurity(
  withLogging(verifyResetCodeHandler),
  {
    rateLimit: 'passwordReset',
    allowedMethods: ['POST'],
    cors: true
  }
);