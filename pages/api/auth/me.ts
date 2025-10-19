import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { withSecurity, withLogging } from '@/lib/middleware';

interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  tokenVersion: number;
  iat: number;
  exp: number;
}

async function meHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
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

    if (!token) {
      return res.status(401).json({ 
        error: 'No token provided',
        message: 'Authentication required' 
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    
    await dbConnect();
    
    // Get current user from database
    const user = await User.findById(decoded.userId)
      .select('+tokenVersion +status +role +emailVerified +firstName +lastName +profileImage +lastLogin')
      .lean();
    
    if (!user) {
      return res.status(401).json({ 
        error: 'User not found',
        message: 'Invalid token' 
      });
    }

    // Check if user account is deleted
    if (user.status === 'deleted') {
      return res.status(404).json({ 
        error: 'Account not found',
        message: 'User account has been deleted' 
      });
    }

    // Check token version (for session invalidation)
    if (user.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({ 
        error: 'Token invalidated',
        message: 'Please log in again' 
      });
    }

    // Return user data (excluding sensitive fields)
    const userData = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      profileImage: user.profileImage,
      lastLogin: user.lastLogin
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