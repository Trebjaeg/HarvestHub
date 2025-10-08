import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { withSecurity, withLogging } from '@/lib/middleware';
import { sanitizeInput, hashToken } from '@/lib/security';

async function verifyResetCodeHandler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== VERIFY RESET CODE REQUEST ===');
  console.log('Method:', req.method);
  console.log('Request body:', req.body);
  
  let { email, code } = req.body;

  if (!email || !code) {
    console.log('ERROR: Missing email or code');
    return res.status(400).json({ 
      message: 'Email and verification code are required',
      success: false 
    });
  }

  // Sanitize inputs
  email = sanitizeInput(email).toLowerCase();
  code = sanitizeInput(code);
  
  console.log('Sanitized inputs - Email:', email, 'Code:', code);
  console.log('Code length:', code.length);

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ 
      message: 'Invalid email format',
      success: false 
    });
  }

  // Validate code format (4 digits)
  if (!/^\d{4}$/.test(code)) {
    return res.status(400).json({ 
      message: 'Invalid verification code format. Code must be 4 digits.',
      success: false 
    });
  }

  try {
    await dbConnect();
    console.log('Verifying code for email:', email, 'Code received:', code);
    console.log('Raw code type:', typeof code, 'Raw code value:', JSON.stringify(code));
    
    const codeHash = hashToken(code);
    console.log('Code hash generated:', codeHash);
    console.log('Searching for user with email and token hash...');
    
    const user = await User.findOne({ 
      email, 
      resetPasswordToken: codeHash, 
      resetPasswordExpires: { $gt: new Date() } 
    }).exec();
    
    console.log('User found with matching code hash:', !!user);
    
    if (!user) {
      // Let's also check if user exists with this email but different code
      const userWithEmail = await User.findOne({ email }).exec();
      console.log('User exists with email:', !!userWithEmail);
      if (userWithEmail) {
        console.log('Stored token hash:', userWithEmail.resetPasswordToken);
        console.log('Expected token hash:', codeHash);
        console.log('Hashes match:', userWithEmail.resetPasswordToken === codeHash);
        console.log('Token expires:', userWithEmail.resetPasswordExpires);
        console.log('Current time:', new Date());
        console.log('Token still valid:', userWithEmail.resetPasswordExpires > new Date());
      }
      
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