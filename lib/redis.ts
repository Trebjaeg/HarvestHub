// Redis wrapper - falls back to memory cache if Redis is not available
import { cache as memoryCache, cacheKeys as memoryCacheKeys } from './memory-cache';

// Check if Redis is enabled
const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true';

let Redis: any = null;
let redis: any = null;

// Only try to load Redis if enabled
if (REDIS_ENABLED) {
  try {
    Redis = require('ioredis').default;
  } catch (error) {
    console.log('⚠️ Redis not available, using in-memory cache instead');
  }
}

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

/**
 * Get Redis client instance (singleton pattern)
 */
export function getRedisClient(): any | null {
  if (!REDIS_ENABLED || !Redis) {
    return null;
  }

  if (!redis) {
    try {
      redis = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy(times: number) {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        connectTimeout: 10000,
        lazyConnect: true,
      });

      redis.on('error', (err: Error) => {
        console.error('Redis error:', err);
      });

      redis.on('connect', () => {
        console.log('✅ Redis connected');
      });

      // Connect immediately
      redis.connect().catch((err: Error) => {
        console.error('Failed to connect to Redis:', err);
        redis = null;
      });
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      redis = null;
    }
  }

  return redis;
}

/**
 * Cache helper functions - uses Redis if available, falls back to memory cache
 */
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const client = getRedisClient();
    
    // Use Redis if available
    if (client) {
      try {
        const data = await client.get(key);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.error('Redis GET error, falling back to memory cache:', error);
      }
    }
    
    // Fallback to memory cache
    return memoryCache.get<T>(key);
  },

  async set(key: string, value: any, ttl: number = 300): Promise<boolean> {
    const client = getRedisClient();
    
    // Use Redis if available
    if (client) {
      try {
        await client.setex(key, ttl, JSON.stringify(value));
        // Also set in memory cache as backup
        await memoryCache.set(key, value, ttl);
        return true;
      } catch (error) {
        console.error('Redis SET error, falling back to memory cache:', error);
      }
    }
    
    // Fallback to memory cache
    return memoryCache.set(key, value, ttl);
  },

  async del(key: string): Promise<boolean> {
    const client = getRedisClient();
    
    // Use Redis if available
    if (client) {
      try {
        await client.del(key);
      } catch (error) {
        console.error('Redis DEL error:', error);
      }
    }
    
    // Also delete from memory cache
    return memoryCache.del(key);
  },

  async delPattern(pattern: string): Promise<boolean> {
    const client = getRedisClient();
    
    // Use Redis if available
    if (client) {
      try {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
          await client.del(...keys);
        }
      } catch (error) {
        console.error('Redis DEL pattern error:', error);
      }
    }
    
    // Also delete from memory cache
    return memoryCache.delPattern(pattern);
  },

  async exists(key: string): Promise<boolean> {
    const client = getRedisClient();
    
    // Use Redis if available
    if (client) {
      try {
        const result = await client.exists(key);
        return result === 1;
      } catch (error) {
        console.error('Redis EXISTS error:', error);
      }
    }
    
    // Fallback to memory cache
    return memoryCache.exists(key);
  },

  async incr(key: string, ttl?: number): Promise<number> {
    const client = getRedisClient();
    
    // Use Redis if available
    if (client) {
      try {
        const value = await client.incr(key);
        if (ttl && value === 1) {
          await client.expire(key, ttl);
        }
        return value;
      } catch (error) {
        console.error('Redis INCR error:', error);
      }
    }
    
    // Fallback to memory cache
    return memoryCache.incr(key, ttl);
  },
};

/**
 * Cache key builders for consistent naming
 */
export const cacheKeys = memoryCacheKeys;

export default redis;
