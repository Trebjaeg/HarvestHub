import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { sanitizeReturnUrl, getBaseUrl } from '@/lib/auth-utils';

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get token from cookies
    const token = req.cookies['auth-token'] || req.cookies['userToken'] || req.cookies['hh_token'];

    if (!token) {
      console.log('🔀 Post-login redirect: No token found, redirecting to auth');
      return res.status(200).json({ 
        redirectUrl: '/auth'
      });
    }

    // Verify the token
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      if (!decoded) {
        console.log('🔀 Post-login redirect: Invalid token');
        return res.status(200).json({ 
          redirectUrl: '/auth'
        });
      }
    } catch (verifyError) {
      console.log('🔀 Post-login redirect: Token verification failed');
      return res.status(200).json({ 
        redirectUrl: '/auth'
      });
    }

    // Get and validate return URL
    const { returnUrl } = req.body;
    const baseUrl = getBaseUrl();
    const targetUrl = sanitizeReturnUrl(returnUrl, '/home', baseUrl);
    
    console.log('🔀 Post-login redirect: redirecting to:', targetUrl);

    // Return the validated URL instead of redirecting
    return res.status(200).json({ 
      redirectUrl: targetUrl
    });

  } catch (error) {
    console.error('Post-login redirect error:', error);
    
    return res.status(200).json({ 
      redirectUrl: '/'
    });
  }
}