import { NextRequest, NextResponse } from 'next/server';

interface RateLimiterOptions {
  windowMs: number;
  max: number;
}

// Simple in-memory rate limiter for App Router
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Rate limiter for Next.js App Router
 * Usage: const response = await applyRateLimit(request, { max: 100, windowMs: 15 * 60 * 1000 });
 */
export async function applyRateLimit(
  request: NextRequest,
  options: RateLimiterOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
  }
): Promise<NextResponse | null> {
  // Get client identifier (IP address)
  const identifier =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
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
      
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': options.max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': record.resetAt.toString(),
          },
        }
      );
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

  // Return null if not rate limited (request can proceed)
  return null;
}

/**
 * Get rate limit headers for successful requests
 */
export function getRateLimitHeaders(
  identifier: string,
  options: RateLimiterOptions
): Record<string, string> {
  const record = rateLimitStore.get(identifier);
  
  if (!record) {
    return {
      'X-RateLimit-Limit': options.max.toString(),
      'X-RateLimit-Remaining': options.max.toString(),
    };
  }

  return {
    'X-RateLimit-Limit': options.max.toString(),
    'X-RateLimit-Remaining': Math.max(0, options.max - record.count).toString(),
    'X-RateLimit-Reset': record.resetAt.toString(),
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
