import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { rateLimiter, RATE_LIMITS, getClientIP, applySecurityHeaders, sanitizeInput } from '@/lib/security';
import { DatabaseUtils, QueryProfiler } from '@/lib/database-utils';
import { validatePasswordStrength } from '@/lib/password-strength';
import { validateEmail } from '@/lib/validate-email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[REGISTER] API called', req.method, req.body);
  
  // Apply security headers
  applySecurityHeaders(res);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const clientIP = getClientIP(req);
  
  // Rate limiting
  if (!rateLimiter.check(`register:${clientIP}`, RATE_LIMITS.register)) {
    return res.status(429).json({ 
      message: 'Too many registration attempts. Please try again later.',
      retryAfter: Math.ceil(RATE_LIMITS.register.windowMs / 1000)
    });
  }

  let { name, email, password } = req.body;
  
  // Input validation and sanitization
  if (!name || !email || !password) {
    console.log('[REGISTER] Missing fields', { name, email, password });
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Sanitize inputs
  name = sanitizeInput(name);
  email = sanitizeInput(email).toLowerCase();
  
  // Validate input lengths
  if (name.length < 2 || name.length > 100) {
    return res.status(400).json({ message: 'Name must be between 2 and 100 characters' });
  }
  
  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
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

  try {
    await dbConnect();
    console.log('[REGISTER] Connected to DB');

    // Check for existing user
    const existingUser = await User.findOne({ email }).select('_id').exec();

    if (existingUser) {
      console.log('[REGISTER] Email already in use:', email);
      return res.status(409).json({ message: 'Email already in use' });
    }

    // Hash password with higher cost for better security
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const userData = {
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Create user with error handling
    const newUser = new User(userData);
    const user = await newUser.save();

    console.log('[REGISTER] User created successfully:', user._id);

    // Return success without sensitive data
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        sellerStatus: user.sellerStatus,
        createdAt: user.createdAt
      }
    });

  } catch (error: any) {
    console.error('[REGISTER] Error:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    return res.status(500).json({ message: 'Internal server error' });
  }
}
