import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { withSecurity, withLogging } from '@/lib/middleware';
import { DatabaseUtils, QueryProfiler } from '@/lib/database-utils';
import { sanitizeInput, hashToken } from '@/lib/security';
import { validatePasswordStrength } from '@/lib/password-strength';

async function resetPasswordHandler(req: NextApiRequest, res: NextApiResponse) {
  let { resetToken, password } = req.body || {};
  
  if (!resetToken || !password) {
    return res.status(400).json({ message: 'Reset token and password are required' });
  }

  // Sanitize inputs
  resetToken = sanitizeInput(resetToken);
  
  try {
    // Verify JWT reset token
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
      purpose: string;
      codeUsed: string;
    };

    // Validate token purpose
    if (decoded.purpose !== 'password_reset') {
      return res.status(400).json({ message: 'Invalid reset token purpose' });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (passwordValidation.score < 2) {
      return res.status(400).json({ 
        message: 'Password is too weak. Please use a stronger password.',
        suggestions: passwordValidation.feedback ? 
          (Array.isArray(passwordValidation.feedback) ? passwordValidation.feedback : [passwordValidation.feedback]) :
          ['Use a longer password with mixed characters']
      });
    }

    await dbConnect();
    
    // Find user by ID from JWT token
    const user = await User.findById(decoded.userId).exec();

    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'User not found or token invalid.' 
      });
    }

    console.log('About to hash password for user:', user.email);
    console.log('Plain password length:', password.length);
    console.log('Old password hash:', user.password);
    
    // Hash password with higher security (12 rounds)
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    console.log('New password hash:', hashedPassword);
    console.log('Hash starts with $2a or $2b:', hashedPassword.startsWith('$2a') || hashedPassword.startsWith('$2b'));
    
    // Update user password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.updatedAt = new Date();
    
    // Reset any account lockout since password was successfully reset
    user.failedLoginAttempts = 0;
    user.accountLocked = false;
    user.lockUntil = null;
    
    await user.save();
    
    console.log('Password successfully updated for user:', user.email);
    console.log('Password hash length:', hashedPassword.length);
    console.log('User account unlocked and reset tokens cleared');
    
    // Verify the password immediately after saving
    const testMatch = await bcrypt.compare(password, hashedPassword);
    console.log('Immediate password verification test:', testMatch);

    return res.status(200).json({ 
      success: true,
      message: 'Password has been successfully updated. You can now log in with your new password.' 
    });
    
  } catch (jwtError: any) {
    // Handle JWT verification errors
    if (jwtError.name === 'JsonWebTokenError') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid reset token. Please request a new password reset.' 
      });
    }
    if (jwtError.name === 'TokenExpiredError') {
      return res.status(400).json({ 
        success: false,
        message: 'Reset token has expired. Please request a new password reset.' 
      });
    }
    
    console.error('Password reset error:', jwtError);
    return res.status(500).json({ 
      success: false,
      message: 'Unable to reset password. Please try again later.' 
    });
  }
}

// Apply security middleware with rate limiting for password reset
export default withSecurity(
  withLogging(resetPasswordHandler),
  {
    rateLimit: 'passwordResetSubmit',
    allowedMethods: ['POST'],
    cors: true
  }
);
