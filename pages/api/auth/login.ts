import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import { rateLimiter, RATE_LIMITS, getClientIP, applySecurityHeaders, sanitizeInput } from '@/lib/security';

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Apply security headers
  applySecurityHeaders(res);

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const clientIP = getClientIP(req);
  
  // Rate limiting for production
  if (!rateLimiter.check(`login:${clientIP}`, RATE_LIMITS.login)) {
    return res.status(429).json({ 
      message: 'Too many login attempts. Please try again later.',
      retryAfter: Math.ceil(RATE_LIMITS.login.windowMs / 1000)
    });
  }

  let { email, password } = req.body;

  // Input validation and sanitization
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  email = sanitizeInput(email).toLowerCase();
  
  if (password.length < 8 || password.length > 128) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  try {
    await dbConnect();

    // Find user with simple query
    const user = await User.findOne({ email }).exec();

    if (!user) {
      // Simulate password check to prevent timing attacks
      await bcrypt.compare(password, '$2a$10$dummyhashtopreventtimingattacks');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if account is locked (with proper type checking)
    const isLocked = user.lockUntil && user.lockUntil.getTime() > Date.now();
    if (isLocked) {
      return res.status(423).json({ 
        message: 'Account temporarily locked due to multiple failed login attempts. Please try again later.' 
      });
    }

    console.log('Login attempt for user:', user.email);
    console.log('Input password length:', password.length);
    console.log('Stored password hash:', user.password);
    console.log('Hash length:', user.password ? user.password.length : 'null');
    
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password comparison result:', isMatch);
    
    if (!isMatch) {
      console.log('Password mismatch for user:', user.email);
      // Increment failed login attempts
      try {
        await (user as any).incLoginAttempts();
      } catch (err) {
        console.error('Error incrementing login attempts:', err);
      }
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if email is verified
    if (!user.isVerified) {
      console.log('Login attempt with unverified email:', user.email);
      return res.status(403).json({ 
        message: 'Please verify your email first. Check your inbox for the verification link.',
        requiresVerification: true,
        email: user.email
      });
    }
    
    console.log('Login successful for user:', user.email);

    // Reset failed login attempts on successful login
    try {
      await (user as any).resetLoginAttempts();
    } catch (err) {
      console.error('Error resetting login attempts:', err);
    }

    // Log admin login for audit trail
    if (user.role === 'admin' || user.role === 'superadmin') {
      try {
        await AuditLog.create({
          performedBy: user._id,
          action: 'admin_login',
          targetUser: null,
          reason: 'Admin panel access',
          details: {
            loginMethod: 'password',
            userEmail: user.email,
            userRole: user.role
          },
          ipAddress: clientIP,
          userAgent: req.headers['user-agent'],
          severity: 'low'
        });
      } catch (auditError) {
        console.error('Failed to log admin login:', auditError);
        // Don't fail the login if audit logging fails
      }
    }

    // Generate JWT with enhanced security
    const tokenPayload = {
      userId: user._id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      jti: Math.random().toString(36).substr(2, 9), // Unique token ID
    };

    const token = jwt.sign(
      tokenPayload,
      JWT_SECRET,
      { 
        expiresIn: '7d',
        algorithm: 'HS256',
        issuer: 'harvesthub',
        audience: 'harvesthub-client'
      }
    );

    // Set HTTP-only cookie with flexible settings for IP access
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = isProduction 
      ? `auth-token=${token}; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}; Path=/`
      : `auth-token=${token}; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}; Path=/`;
    
    console.log('🍪 Setting cookie:', cookieOptions);
    res.setHeader('Set-Cookie', cookieOptions);

    // Return success response
    return res.status(200).json({ 
      success: true,
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        isVerified: user.isVerified,
        sellerStatus: user.sellerStatus,
        lastLogin: user.lastLogin
      } 
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
