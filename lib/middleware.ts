import { NextApiRequest, NextApiResponse } from 'next';
import { rateLimiter, RATE_LIMITS, getClientIP, applySecurityHeaders } from '@/lib/security';
import jwt from 'jsonwebtoken';

export type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;

interface SecurityOptions {
  rateLimit?: keyof typeof RATE_LIMITS;
  requireAuth?: boolean;
  allowedMethods?: string[];
  cors?: boolean;
}

/**
 * Security middleware wrapper for API routes
 */
export function withSecurity(
  handler: ApiHandler,
  options: SecurityOptions = {}
): ApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Apply security headers
      applySecurityHeaders(res);

      // CORS handling
      if (options.cors) {
        res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
        res.setHeader('Access-Control-Allow-Methods', options.allowedMethods?.join(', ') || 'GET, POST, PUT, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        if (req.method === 'OPTIONS') {
          res.status(200).end();
          return;
        }
      }

      // Method validation
      if (options.allowedMethods && !options.allowedMethods.includes(req.method || '')) {
        res.status(405).json({ message: 'Method not allowed' });
        return;
      }

      // Rate limiting
      if (options.rateLimit) {
        const clientIP = getClientIP(req);
        const rateLimitKey = `${options.rateLimit}:${clientIP}`;
        
        if (!rateLimiter.check(rateLimitKey, RATE_LIMITS[options.rateLimit])) {
          res.status(429).json({
            message: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil(RATE_LIMITS[options.rateLimit].windowMs / 1000)
          });
          return;
        }
      }

      // Authentication check
      if (options.requireAuth) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          res.status(401).json({ message: 'Authentication required' });
          return;
        }

        try {
          const jwt = require('jsonwebtoken');
          const token = authHeader.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          
          // Attach user info to request
          (req as any).user = decoded;
        } catch (error) {
          res.status(401).json({ message: 'Invalid or expired token' });
          return;
        }
      }

      // Call the actual handler
      await handler(req, res);

    } catch (error) {
      console.error('Security middleware error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
}

/**
 * Input validation middleware
 */
export function validateInput(schema: any) {
  return (handler: ApiHandler): ApiHandler => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      try {
        // Basic input validation (you can integrate with libraries like Joi or Yup)
        if (req.method === 'POST' || req.method === 'PUT') {
          const { error } = schema.validate(req.body);
          if (error) {
            res.status(400).json({
              message: 'Validation error',
              errors: error.details.map((detail: any) => detail.message)
            });
            return;
          }
        }

        await handler(req, res);
      } catch (error) {
        console.error('Validation middleware error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    };
  };
}

/**
 * Request logging middleware
 */
export function withLogging(handler: ApiHandler): ApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const start = Date.now();
    const clientIP = getClientIP(req);
    
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - IP: ${clientIP}`);

    try {
      await handler(req, res);
    } finally {
      const duration = Date.now() - start;
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    }
  };
}

/**
 * Cookie-based authentication middleware for API routes
 * Verifies the auth-token cookie and attaches userId to request
 */
export function withCookieAuth(handler: ApiHandler): ApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Get token from cookies
      const token = req.cookies['auth-token'];
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Verify JWT token
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        console.error('JWT_SECRET not configured');
        return res.status(500).json({
          success: false,
          message: 'Server configuration error'
        });
      }

      const decoded = jwt.verify(token, secret) as any;
      
      // Attach user ID to request
      (req as any).userId = decoded.userId;
      (req as any).user = decoded;

      // Call the actual handler
      await handler(req, res);
    } catch (error) {
      console.error('Cookie auth error:', error);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  };
}
