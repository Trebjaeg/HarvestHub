import crypto from 'crypto';

// CSRF token utilities
export class CSRFProtection {
  private static readonly CSRF_SECRET = process.env.CSRF_SECRET || 'csrf-secret-key';
  private static readonly TOKEN_LENGTH = 32;

  /**
   * Generate a CSRF token
   */
  static generateToken(): string {
    return crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
  }

  /**
   * Generate a secure CSRF token with timestamp
   */
  static generateSecureToken(): string {
    const timestamp = Date.now().toString();
    const randomBytes = crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
    const payload = `${timestamp}:${randomBytes}`;
    
    const hmac = crypto.createHmac('sha256', this.CSRF_SECRET);
    hmac.update(payload);
    const signature = hmac.digest('hex');
    
    return `${payload}:${signature}`;
  }

  /**
   * Verify a CSRF token
   */
  static verifyToken(token: string): boolean {
    if (!token) return false;

    try {
      const parts = token.split(':');
      if (parts.length !== 3) return false;

      const [timestamp, randomBytes, signature] = parts;
      const payload = `${timestamp}:${randomBytes}`;
      
      const hmac = crypto.createHmac('sha256', this.CSRF_SECRET);
      hmac.update(payload);
      const expectedSignature = hmac.digest('hex');
      
      // Constant-time comparison to prevent timing attacks
      if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'))) {
        return false;
      }

      // Check if token is not too old (24 hours)
      const tokenTime = parseInt(timestamp);
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      if (Date.now() - tokenTime > maxAge) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('CSRF token verification error:', error);
      return false;
    }
  }

  /**
   * Middleware to verify CSRF token for state-changing operations
   */
  static verifyCSRFMiddleware(req: any, res: any, next: any) {
    // Skip CSRF check for GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // Check CSRF token in header or body
    const token = req.headers['x-csrf-token'] || req.body.csrfToken;
    
    if (!token || !CSRFProtection.verifyToken(token)) {
      return res.status(403).json({
        error: 'CSRF token missing or invalid',
        message: 'Request rejected for security reasons'
      });
    }

    next();
  }
}

/**
 * Session token utilities
 */
export class SessionManager {
  private static readonly SESSION_SECRET = process.env.JWT_SECRET || 'session-secret';
  
  /**
   * Generate a secure session ID
   */
  static generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a signed session cookie value
   */
  static signSessionValue(value: string): string {
    const hmac = crypto.createHmac('sha256', this.SESSION_SECRET);
    hmac.update(value);
    const signature = hmac.digest('hex');
    return `${value}.${signature}`;
  }

  /**
   * Verify and extract session value from signed cookie
   */
  static verifySessionValue(signedValue: string): string | null {
    try {
      const parts = signedValue.split('.');
      if (parts.length !== 2) return null;

      const [value, signature] = parts;
      const hmac = crypto.createHmac('sha256', this.SESSION_SECRET);
      hmac.update(value);
      const expectedSignature = hmac.digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'))) {
        return null;
      }

      return value;
    } catch (error) {
      return null;
    }
  }
}

/**
 * Generate secure cookie options
 */
export function getSecureCookieOptions(isProduction: boolean = process.env.NODE_ENV === 'production') {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/'
  };
}

/**
 * Format cookie string with secure options
 */
export function formatSecureCookie(name: string, value: string, options?: Partial<{
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  path: string;
}>): string {
  const defaultOptions = getSecureCookieOptions();
  const finalOptions = { ...defaultOptions, ...options };

  let cookie = `${name}=${value}`;
  
  if (finalOptions.httpOnly) cookie += '; HttpOnly';
  if (finalOptions.secure) cookie += '; Secure';
  if (finalOptions.sameSite) cookie += `; SameSite=${finalOptions.sameSite}`;
  if (finalOptions.maxAge) cookie += `; Max-Age=${finalOptions.maxAge}`;
  if (finalOptions.path) cookie += `; Path=${finalOptions.path}`;

  return cookie;
}