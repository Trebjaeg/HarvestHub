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
    console.log('🚪 Logout API called');
    console.log('🚪 Current cookies:', req.cookies);
    
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
        console.log('🚪 User logging out:', decoded.email);
      } catch (error) {
        // Token might be invalid, but we still want to clear cookies
        console.error('🚪 Error during logout token verification:', error);
      }
    }

    // Clear all possible auth cookies with multiple variations to ensure deletion
    const cookieNames = ['auth-token', 'userToken', 'hh_token'];
    const cookieHeaders: string[] = [];
    
    // For each cookie, try multiple deletion strategies
    cookieNames.forEach(name => {
      // Delete with path=/
      cookieHeaders.push(`${name}=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/`);
      
      // Delete with path=/api
      cookieHeaders.push(`${name}=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/api`);
      
      // Delete with domain
      if (req.headers.host) {
        const hostname = req.headers.host.split(':')[0];
        cookieHeaders.push(`${name}=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/; Domain=${hostname}`);
      }
    });
    
    res.setHeader('Set-Cookie', cookieHeaders);
    
    console.log('🚪 Cookies cleared, headers set:', cookieHeaders.length);

    return res.status(200).json({ 
      success: true,
      message: 'Logged out successfully' 
    });

  } catch (error) {
    console.error('🚪 Logout error:', error);
    
    // Even if there's an error, clear cookies
    const cookieNames = ['auth-token', 'userToken', 'hh_token'];
    const cookieHeaders: string[] = [];
    
    cookieNames.forEach(name => {
      cookieHeaders.push(`${name}=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/`);
      cookieHeaders.push(`${name}=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/api`);
      
      if (req.headers.host) {
        const hostname = req.headers.host.split(':')[0];
        cookieHeaders.push(`${name}=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/; Domain=${hostname}`);
      }
    });
    
    res.setHeader('Set-Cookie', cookieHeaders);

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