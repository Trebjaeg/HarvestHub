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

async function logoutHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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

    // If we have a token, invalidate it by incrementing token version
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
        
        await dbConnect();
        
        // Increment token version to invalidate all existing tokens for this user
        await User.findByIdAndUpdate(
          decoded.userId, 
          { $inc: { tokenVersion: 1 } },
          { new: true }
        );
        
        console.log('User tokens invalidated:', decoded.email);
      } catch (error) {
        // Token might be invalid, but we still want to clear cookies
        console.error('Error invalidating token:', error);
      }
    }

    // Clear all possible auth cookies
    const cookieOptions = 'HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/';
    
    res.setHeader('Set-Cookie', [
      `auth-token=; ${cookieOptions}`,
      `userToken=; ${cookieOptions}`,
      `hh_token=; ${cookieOptions}`
    ]);

    return res.status(200).json({ 
      success: true,
      message: 'Logged out successfully' 
    });

  } catch (error) {
    console.error('Logout error:', error);
    
    // Even if there's an error, clear cookies
    const cookieOptions = 'HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/';
    
    res.setHeader('Set-Cookie', [
      `auth-token=; ${cookieOptions}`,
      `userToken=; ${cookieOptions}`,
      `hh_token=; ${cookieOptions}`
    ]);

    return res.status(200).json({ 
      success: true,
      message: 'Logged out successfully' 
    });
  }
}

export default withSecurity(
  withLogging(logoutHandler),
  {
    rateLimit: 'general',
    allowedMethods: ['POST'],
    cors: true
  }
);