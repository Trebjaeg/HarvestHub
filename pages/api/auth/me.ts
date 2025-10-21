import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { withSecurity, withLogging } from '@/lib/middleware';

interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
  jti: string;
}

async function meHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('🔍 /api/auth/me: Handler called');
    console.log('🔍 /api/auth/me: All cookies:', Object.keys(req.cookies));
    console.log('🔍 /api/auth/me: Cookie values:', req.cookies);
    
    // Get token from cookies or Authorization header
    let token = req.cookies['auth-token'] || 
                req.cookies['userToken'] || 
                req.cookies['hh_token'];

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    console.log('🔍 /api/auth/me: Token found:', !!token, token ? `(${token.substring(0, 20)}...)` : '');

    if (!token) {
      console.log('🔍 /api/auth/me: No token, returning 401');
      return res.status(401).json({ 
        error: 'No token provided',
        message: 'Authentication required',
        authenticated: false
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    
    await dbConnect();
    
    // Get current user from database
    const user = await User.findById(decoded.userId)
      .select('+status +role +emailVerified +firstName +lastName +profileImage +lastLogin')
      .lean();
    
    if (!user) {
      return res.status(401).json({ 
        error: 'User not found',
        message: 'Invalid token' 
      });
    }

    // Check if user account is deleted
    if ((user as any).status === 'deleted') {
      return res.status(404).json({ 
        error: 'Account not found',
        message: 'User account has been deleted' 
      });
    }

    // Return user data (excluding sensitive fields)
    const userData = {
      id: (user as any)._id.toString(),
      email: (user as any).email,
      firstName: (user as any).firstName,
      lastName: (user as any).lastName,
      role: (user as any).role,
      status: (user as any).status,
      emailVerified: (user as any).emailVerified,
      profileImage: (user as any).profileImage,
      lastLogin: (user as any).lastLogin
    };

    return res.status(200).json({ 
      success: true,
      user: userData 
    });

  } catch (error: any) {
    console.error('Authentication verification error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'Please log in again' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Please log in again' 
      });
    }

    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Authentication verification failed' 
    });
  }
}

export default withSecurity(
  withLogging(meHandler),
  {
    rateLimit: 'authCheck',
    allowedMethods: ['GET'],
    cors: true
  }
);