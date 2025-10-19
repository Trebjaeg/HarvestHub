import type { NextApiRequest, NextApiResponse } from 'next';
import { CSRFProtection, formatSecureCookie } from '@/lib/csrf-protection';
import { withSecurity, withLogging } from '@/lib/middleware';

async function csrfTokenHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Generate CSRF token
    const csrfToken = CSRFProtection.generateSecureToken();
    
    // Set CSRF token in secure cookie
    const cookieOptions = {
      httpOnly: false, // Client needs to read this for forms
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    };

    const csrfCookie = formatSecureCookie('csrf-token', csrfToken, cookieOptions);
    res.setHeader('Set-Cookie', csrfCookie);

    return res.status(200).json({
      success: true,
      csrfToken,
      message: 'CSRF token generated'
    });

  } catch (error) {
    console.error('CSRF token generation error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate CSRF token'
    });
  }
}

export default withSecurity(
  withLogging(csrfTokenHandler),
  {
    rateLimit: 'general',
    allowedMethods: ['GET'],
    cors: true
  }
);