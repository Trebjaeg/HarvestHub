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

    // If we have a token, we can optionally log the logout
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
        console.log('User logged out:', decoded.email);
      } catch (error) {
        // Token might be invalid, but we still want to clear cookies
        console.error('Error during logout token verification:', error);
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