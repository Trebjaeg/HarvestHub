// In-memory cache implementation (alternative to Redis)
// Works without any external dependencies

interface CacheEntry {
  data: any;
  expiry: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set value in cache with TTL (in seconds)
   */
  set(key: string, value: any, ttlSeconds: number = 300): boolean {
    try {
      const expiry = Date.now() + (ttlSeconds * 1000);
      this.cache.set(key, { data: value, expiry });
      return true;
    } catch (error) {
      console.error('Memory cache SET error:', error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  del(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Delete multiple keys matching a pattern
   */
  delPattern(pattern: string): boolean {
    try {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      const keysToDelete: string[] = [];
      
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          keysToDelete.push(key);
        }
      }
      
      keysToDelete.forEach(key => this.cache.delete(key));
      return true;
    } catch (error) {
      console.error('Memory cache DEL pattern error:', error);
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  exists(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`🧹 Cleaned up ${keysToDelete.length} expired cache entries`);
    }
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

// Create singleton instance
const memoryCache = new MemoryCache();

/**
 * Cache helper functions
 */
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    return memoryCache.get<T>(key);
  },

  async set(key: string, value: any, ttl: number = 300): Promise<boolean> {
    return memoryCache.set(key, value, ttl);
  },

  async del(key: string): Promise<boolean> {
    return memoryCache.del(key);
  },

  async delPattern(pattern: string): Promise<boolean> {
    return memoryCache.delPattern(pattern);
  },

  async exists(key: string): Promise<boolean> {
    return memoryCache.exists(key);
  },

  async incr(key: string, ttl?: number): Promise<number> {
    const current = memoryCache.get<number>(key) || 0;
    const newValue = current + 1;
    memoryCache.set(key, newValue, ttl || 300);
    return newValue;
  },
};

/**
 * Cache key builders for consistent naming
 */
export const cacheKeys: {
  product: (id: string) => string;
  products: (filters: string) => string;
  cart: (userId: string) => string;
  cartCount: (userId: string) => string;
  popularProducts: () => string;
  featuredProducts: () => string;
  categoryProducts: (category: string, page: number) => string;
} = {
  product: (id: string) => `product:${id}`,
  products: (filters: string) => `products:${filters}`,
  cart: (userId: string) => `cart:${userId}`,
  cartCount: (userId: string) => `cart:count:${userId}`,
  popularProducts: () => `products:popular`,
  featuredProducts: () => `products:featured`,
  categoryProducts: (category: string, page: number) => `products:category:${category}:${page}`,
};

// Cleanup on process exit
process.on('SIGTERM', () => memoryCache.destroy());
process.on('SIGINT', () => memoryCache.destroy());

export default memoryCache;
