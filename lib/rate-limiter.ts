import { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';

interface RateLimiterOptions {
  windowMs: number;
  max: number;
}

// Simple in-memory rate limiter (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function rateLimiter(
  handler: NextApiHandler,
  options: RateLimiterOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
  }
): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Get client identifier (IP address or user ID)
    const identifier =
      req.headers['x-forwarded-for']?.toString() ||
      req.socket.remoteAddress ||
      'unknown';

    const now = Date.now();
    const record = rateLimitStore.get(identifier);

    // Clean up expired entries
    if (record && now > record.resetAt) {
      rateLimitStore.delete(identifier);
    }

    // Check rate limit
    if (record && now <= record.resetAt) {
      if (record.count >= options.max) {
        const retryAfter = Math.ceil((record.resetAt - now) / 1000);
        res.setHeader('Retry-After', retryAfter.toString());
        res.setHeader('X-RateLimit-Limit', options.max.toString());
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', record.resetAt.toString());

        return res.status(429).json({
          error: 'Too many requests',
          message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
        });
      }

      // Increment count
      record.count += 1;
      rateLimitStore.set(identifier, record);
    } else {
      // Create new record
      rateLimitStore.set(identifier, {
        count: 1,
        resetAt: now + options.windowMs,
      });
    }

    const currentRecord = rateLimitStore.get(identifier)!;
    res.setHeader('X-RateLimit-Limit', options.max.toString());
    res.setHeader(
      'X-RateLimit-Remaining',
      (options.max - currentRecord.count).toString()
    );
    res.setHeader('X-RateLimit-Reset', currentRecord.resetAt.toString());

    return handler(req, res);
  };
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000); // Clean up every minute
