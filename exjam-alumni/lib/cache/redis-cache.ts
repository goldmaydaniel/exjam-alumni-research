/**
 * Redis-like caching implementation
 * Uses in-memory for development, can be swapped with Redis for production
 */

interface CacheItem<T = any> {
  value: T;
  expiresAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired items every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  async set<T>(key: string, value: T, expiresIn: number): Promise<void> {
    const expiresAt = Date.now() + expiresIn * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  async setex<T>(key: string, expiresIn: number, value: T): Promise<void> {
    return this.set(key, value, expiresIn);
  }

  async del(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  async ttl(key: string): Promise<number> {
    const item = this.cache.get(key);
    
    if (!item) {
      return -2; // Key doesn't exist
    }

    const remaining = item.expiresAt - Date.now();
    
    if (remaining <= 0) {
      this.cache.delete(key);
      return -2;
    }

    return Math.floor(remaining / 1000);
  }

  async flush(): Promise<void> {
    this.cache.clear();
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

// Singleton instance
let cacheInstance: MemoryCache | null = null;

export function getCache(): MemoryCache {
  if (!cacheInstance) {
    cacheInstance = new MemoryCache();
  }
  return cacheInstance;
}

// Cache key generators
export const cacheKeys = {
  // Alumni directory caching
  alumniDirectory: (filters: Record<string, any>) => {
    const sortedFilters = Object.keys(filters)
      .sort()
      .reduce((obj, key) => {
        obj[key] = filters[key];
        return obj;
      }, {} as any);
    
    return `alumni:directory:${JSON.stringify(sortedFilters)}`;
  },
  
  alumniProfile: (userId: string) => `alumni:profile:${userId}`,
  
  // Event caching
  eventDetails: (eventId: string) => `event:details:${eventId}`,
  eventCapacity: (eventId: string) => `event:capacity:${eventId}`,
  eventRegistrations: (eventId: string) => `event:registrations:${eventId}`,
  
  // User caching  
  userProfile: (userId: string) => `user:profile:${userId}`,
  userRegistrations: (userId: string) => `user:registrations:${userId}`,
  
  // Statistics caching
  dashboardStats: () => 'stats:dashboard',
  eventStats: (eventId: string) => `stats:event:${eventId}`,
};

// Cache durations (in seconds)
export const cacheDurations = {
  // Short-term caching
  eventCapacity: 30, // 30 seconds - needs to be fresh
  userSession: 300, // 5 minutes
  
  // Medium-term caching  
  alumniDirectory: 600, // 10 minutes
  eventDetails: 900, // 15 minutes
  userProfile: 1800, // 30 minutes
  
  // Long-term caching
  dashboardStats: 3600, // 1 hour
  eventStats: 3600, // 1 hour
};

// Cache wrapper utility
export async function withCache<T>(
  key: string,
  duration: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cache = getCache();
  
  // Try to get from cache first
  const cached = await cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }
  
  // Fetch fresh data
  const fresh = await fetcher();
  
  // Store in cache
  await cache.setex(key, duration, fresh);
  
  return fresh;
}

// Cache invalidation helpers
export const cacheInvalidation = {
  // Invalidate user-related caches
  async invalidateUser(userId: string): Promise<void> {
    const cache = getCache();
    const keys = [
      cacheKeys.userProfile(userId),
      cacheKeys.userRegistrations(userId),
      cacheKeys.alumniProfile(userId),
    ];
    
    await Promise.all(keys.map(key => cache.del(key)));
  },
  
  // Invalidate event-related caches
  async invalidateEvent(eventId: string): Promise<void> {
    const cache = getCache();
    const keys = [
      cacheKeys.eventDetails(eventId),
      cacheKeys.eventCapacity(eventId),
      cacheKeys.eventRegistrations(eventId),
      cacheKeys.eventStats(eventId),
    ];
    
    await Promise.all(keys.map(key => cache.del(key)));
    
    // Also invalidate dashboard stats as they might include this event
    await cache.del(cacheKeys.dashboardStats());
  },
  
  // Invalidate alumni directory cache
  async invalidateAlumniDirectory(): Promise<void> {
    const cache = getCache();
    const pattern = 'alumni:directory:*';
    const keys = await cache.keys(pattern);
    
    await Promise.all(keys.map(key => cache.del(key)));
  },
  
  // Invalidate all statistics
  async invalidateStats(): Promise<void> {
    const cache = getCache();
    const patterns = ['stats:*'];
    
    for (const pattern of patterns) {
      const keys = await cache.keys(pattern);
      await Promise.all(keys.map(key => cache.del(key)));
    }
  }
};

// Cache warming functions (preload frequently accessed data)
export const cacheWarming = {
  async warmAlumniDirectory(): Promise<void> {
    const commonFilters = [
      {}, // All alumni
      { graduation: '2020' },
      { graduation: '2021' },
      { graduation: '2022' },
      { squadron: 'GREEN' },
      { squadron: 'RED' },
      { squadron: 'PURPLE' },
      { squadron: 'YELLOW' },
    ];

    // Warm cache with common filter combinations
    for (const filters of commonFilters) {
      try {
        const key = cacheKeys.alumniDirectory(filters);
        const exists = await getCache().exists(key);
        
        if (!exists) {
          // This would typically call the actual alumni search function
          // For now, we'll just mark the pattern
          console.log(`Would warm cache for alumni directory with filters:`, filters);
        }
      } catch (error) {
        console.warn('Failed to warm alumni directory cache:', error);
      }
    }
  },

  async warmDashboardStats(): Promise<void> {
    try {
      const key = cacheKeys.dashboardStats();
      const exists = await getCache().exists(key);
      
      if (!exists) {
        console.log('Would warm dashboard stats cache');
        // This would call the actual stats function
      }
    } catch (error) {
      console.warn('Failed to warm dashboard stats:', error);
    }
  }
};

// Cache metrics for monitoring
export const cacheMetrics = {
  async getStats(): Promise<{
    totalKeys: number;
    hitRate?: number;
    memoryUsage?: number;
  }> {
    const cache = getCache();
    const allKeys = await cache.keys('*');
    
    return {
      totalKeys: allKeys.length,
      // In a real Redis implementation, you'd get hit rate and memory stats
      hitRate: undefined,
      memoryUsage: undefined,
    };
  },

  async getCacheInfo(pattern: string): Promise<{
    keys: string[];
    totalKeys: number;
  }> {
    const cache = getCache();
    const keys = await cache.keys(pattern);
    
    return {
      keys,
      totalKeys: keys.length,
    };
  }
};

export default getCache;