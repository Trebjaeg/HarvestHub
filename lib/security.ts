import crypto from 'crypto';

/**
 * Rate limiting configuration for different endpoints
 */
export const RATE_LIMITS = {
  login: { attempts: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  register: { attempts: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  verification: { attempts: 5, windowMs: 15 * 60 * 1000 }, // 5 verification attempts per 15 minutes
  passwordReset: { attempts: 10, windowMs: 15 * 60 * 1000 }, // 10 attempts per 15 minutes
  passwordResetSubmit: { attempts: 20, windowMs: 15 * 60 * 1000 }, // 20 attempts per 15 minutes for actual password updates
  authCheck: { attempts: 200, windowMs: 15 * 60 * 1000 }, // 200 auth checks per 15 minutes
  general: { attempts: 100, windowMs: 15 * 60 * 1000 } // 100 requests per 15 minutes
};

/**
 * Simple in-memory rate limiter (consider using Redis for production)
 */
class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();

  check(identifier: string, limit: { attempts: number; windowMs: number }): boolean {
    const now = Date.now();
    const key = identifier;
    const record = this.attempts.get(key);

    if (!record || now > record.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + limit.windowMs });
      return true;
    }

    if (record.count >= limit.attempts) {
      return false;
    }

    record.count++;
    return true;
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.attempts.entries()) {
      if (now > record.resetTime) {
        this.attempts.delete(key);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();

// Clean up expired entries every 5 minutes
setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);

/**
 * Generate a cryptographically secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash a token using SHA-256
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Validate and sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Check if IP address is from a trusted source
 */
export function isTrustedIP(ip: string): boolean {
  // Add your trusted IP ranges here
  const trustedRanges = [
    '127.0.0.1', // localhost
    '::1', // localhost IPv6
  ];
  
  return trustedRanges.includes(ip);
}

/**
 * Get client IP address from request
 */
export function getClientIP(req: any): string {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.ip ||
         '127.0.0.1';
}

/**
 * Security headers for API responses
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(res: any): void {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}