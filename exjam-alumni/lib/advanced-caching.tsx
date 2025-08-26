"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  key: string;
  tags: string[];
  hits: number;
}

// Cache options
interface CacheOptions {
  maxAge?: number; // milliseconds
  maxSize?: number; // number of entries
  tags?: string[];
  serialize?: boolean;
  background?: boolean; // allow stale data while refreshing
}

// Advanced caching class
export class AdvancedCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultMaxAge = 5 * 60 * 1000; // 5 minutes
  private defaultMaxSize = 100;
  private accessOrder: string[] = [];

  constructor(
    private maxAge: number = 5 * 60 * 1000,
    private maxSize: number = 100
  ) {}

  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const now = Date.now();
    const maxAge = options.maxAge ?? this.maxAge;

    const entry: CacheEntry<T> = {
      data: options.serialize ? JSON.parse(JSON.stringify(data)) : data,
      timestamp: now,
      expiresAt: now + maxAge,
      key,
      tags: options.tags || [],
      hits: 0,
    };

    // Remove oldest entries if cache is full
    if (this.cache.size >= (options.maxSize ?? this.maxSize)) {
      this.evictOldest();
    }

    this.cache.set(key, entry);
    this.updateAccessOrder(key);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T>;
    if (!entry) return null;

    const now = Date.now();

    // Check if expired
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      return null;
    }

    // Update access stats
    entry.hits++;
    this.updateAccessOrder(key);

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    const result = this.cache.delete(key);
    this.removeFromAccessOrder(key);
    return result;
  }

  // Delete by tags
  deleteByTag(tag: string): number {
    let deletedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        this.removeFromAccessOrder(key);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    const validEntries = Array.from(this.cache.values()).filter((entry) => now <= entry.expiresAt);

    return {
      totalEntries: this.cache.size,
      validEntries: validEntries.length,
      expiredEntries: this.cache.size - validEntries.length,
      totalHits: validEntries.reduce((sum, entry) => sum + entry.hits, 0),
      averageAge:
        validEntries.length > 0
          ? validEntries.reduce((sum, entry) => sum + (now - entry.timestamp), 0) /
            validEntries.length
          : 0,
      hitRatio: this.calculateHitRatio(),
      memoryUsage: this.calculateMemoryUsage(),
    };
  }

  // Clear expired entries
  cleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        this.removeFromAccessOrder(key);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  // Clear all entries
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  // Get all keys by tag
  getKeysByTag(tag: string): string[] {
    return Array.from(this.cache.entries())
      .filter(([_, entry]) => entry.tags.includes(tag))
      .map(([key, _]) => key);
  }

  private evictOldest(): void {
    if (this.accessOrder.length > 0) {
      const oldestKey = this.accessOrder[0];
      this.cache.delete(oldestKey);
      this.removeFromAccessOrder(oldestKey);
    }
  }

  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  private calculateHitRatio(): number {
    const validEntries = Array.from(this.cache.values()).filter(
      (entry) => Date.now() <= entry.expiresAt
    );

    if (validEntries.length === 0) return 0;

    const totalHits = validEntries.reduce((sum, entry) => sum + entry.hits, 0);
    return totalHits / validEntries.length;
  }

  private calculateMemoryUsage(): number {
    // Rough estimation of memory usage
    let size = 0;
    for (const entry of this.cache.values()) {
      size += JSON.stringify(entry).length * 2; // Rough estimation
    }
    return size;
  }
}

// Global cache instances
export const queryCache = new AdvancedCache(10 * 60 * 1000, 200); // 10 minutes, 200 entries
export const imageCache = new AdvancedCache(30 * 60 * 1000, 50); // 30 minutes, 50 entries
export const configCache = new AdvancedCache(60 * 60 * 1000, 20); // 1 hour, 20 entries

// React Query-like hook for data fetching with caching
export const useCachedQuery = <TData, TError = Error>(
  key: string | string[],
  queryFn: () => Promise<TData>,
  options: {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
    refetchOnWindowFocus?: boolean;
    retry?: number;
    retryDelay?: number;
    background?: boolean;
    tags?: string[];
  } = {}
) => {
  const cacheKey = Array.isArray(key) ? key.join("-") : key;
  const [data, setData] = useState<TData | undefined>();
  const [error, setError] = useState<TError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const retryCountRef = useRef(0);
  const abortControllerRef = useRef<AbortController>();

  const {
    enabled = true,
    staleTime = 5 * 60 * 1000,
    cacheTime = 10 * 60 * 1000,
    refetchOnWindowFocus = true,
    retry = 3,
    retryDelay = 1000,
    background = false,
    tags = [],
  } = options;

  const fetchData = useCallback(
    async (isBackground = false) => {
      if (!isBackground) {
        setIsLoading(true);
      }
      setError(null);

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        const result = await queryFn();

        // Cache the result
        queryCache.set(cacheKey, result, {
          maxAge: cacheTime,
          tags: [cacheKey, ...tags],
        });

        setData(result);
        setIsStale(false);
        retryCountRef.current = 0;
      } catch (err) {
        if ((err as any).name === "AbortError") return;

        setError(err as TError);

        // Retry logic
        if (retryCountRef.current < retry) {
          retryCountRef.current++;
          setTimeout(
            () => {
              fetchData(isBackground);
            },
            retryDelay * Math.pow(2, retryCountRef.current - 1)
          );
        }
      } finally {
        if (!isBackground) {
          setIsLoading(false);
        }
      }
    },
    [cacheKey, queryFn, cacheTime, tags, retry, retryDelay]
  );

  const refetch = useCallback(() => {
    return fetchData(false);
  }, [fetchData]);

  // Initial load
  useEffect(() => {
    if (!enabled) return;

    // Check cache first
    const cachedData = queryCache.get<TData>(cacheKey);
    if (cachedData) {
      setData(cachedData);

      // Check if data is stale
      const entry = queryCache.cache.get(cacheKey);
      if (entry && Date.now() - entry.timestamp > staleTime) {
        setIsStale(true);
        if (background) {
          fetchData(true); // Background refetch
        }
      }
    } else {
      fetchData(false);
    }
  }, [enabled, cacheKey, fetchData, staleTime, background]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus || !enabled) return;

    const handleFocus = () => {
      if (data && isStale) {
        fetchData(background);
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refetchOnWindowFocus, enabled, data, isStale, fetchData, background]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    error,
    isLoading,
    isStale,
    refetch,
    isSuccess: !isLoading && !error && data !== undefined,
    isError: !isLoading && error !== null,
  };
};

// Context for cache management
interface CacheContextType {
  invalidateQuery: (key: string) => void;
  invalidateByTag: (tag: string) => void;
  prefetchQuery: <T>(
    key: string,
    queryFn: () => Promise<T>,
    options?: CacheOptions
  ) => Promise<void>;
  getCacheStats: () => any;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

export const CacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const invalidateQuery = useCallback((key: string) => {
    queryCache.delete(key);
  }, []);

  const invalidateByTag = useCallback((tag: string) => {
    queryCache.deleteByTag(tag);
  }, []);

  const prefetchQuery = useCallback(
    async <T,>(key: string, queryFn: () => Promise<T>, options: CacheOptions = {}) => {
      if (queryCache.has(key)) return;

      try {
        const data = await queryFn();
        queryCache.set(key, data, options);
      } catch (error) {
        console.warn("Prefetch failed for key:", key, error);
      }
    },
    []
  );

  const getCacheStats = useCallback(() => {
    return {
      query: queryCache.getStats(),
      image: imageCache.getStats(),
      config: configCache.getStats(),
    };
  }, []);

  return (
    <CacheContext.Provider
      value={{
        invalidateQuery,
        invalidateByTag,
        prefetchQuery,
        getCacheStats,
      }}
    >
      {children}
    </CacheContext.Provider>
  );
};

export const useCache = () => {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error("useCache must be used within a CacheProvider");
  }
  return context;
};

// Service Worker cache management
export class ServiceWorkerCache {
  static async register(swPath: string = "/sw.js"): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register(swPath);
      console.log("ServiceWorker registration successful:", registration.scope);
      return registration;
    } catch (error) {
      console.log("ServiceWorker registration failed:", error);
      return null;
    }
  }

  static async cacheResources(cacheName: string, resources: string[]): Promise<void> {
    if (typeof window === "undefined") return;

    const cache = await caches.open(cacheName);
    await cache.addAll(resources);
  }

  static async getCachedResponse(request: string): Promise<Response | null> {
    if (typeof window === "undefined") return null;

    const cache = await caches.open("app-cache-v1");
    return await cache.match(request);
  }

  static async clearCache(cacheName?: string): Promise<void> {
    if (typeof window === "undefined") return;

    if (cacheName) {
      await caches.delete(cacheName);
    } else {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }
  }
}

// Cleanup hook
export const useCacheCleanup = (interval: number = 5 * 60 * 1000) => {
  useEffect(() => {
    const cleanup = () => {
      const cleaned = queryCache.cleanup();
      if (cleaned > 0) {
        console.log(`Cleaned up ${cleaned} expired cache entries`);
      }
    };

    // Initial cleanup
    cleanup();

    // Set up interval
    const intervalId = setInterval(cleanup, interval);

    return () => clearInterval(intervalId);
  }, [interval]);
};

// Local Storage cache with expiration
export class LocalStorageCache {
  private static prefix = "app_cache_";

  static set<T>(key: string, data: T, expirationMs: number = 24 * 60 * 60 * 1000): void {
    try {
      const item = {
        data,
        expiresAt: Date.now() + expirationMs,
      };
      localStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (error) {
      console.warn("LocalStorage set failed:", error);
    }
  }

  static get<T>(key: string): T | null {
    try {
      const itemStr = localStorage.getItem(this.prefix + key);
      if (!itemStr) return null;

      const item = JSON.parse(itemStr);
      if (Date.now() > item.expiresAt) {
        localStorage.removeItem(this.prefix + key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.warn("LocalStorage get failed:", error);
      return null;
    }
  }

  static delete(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  static clear(): void {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  static cleanup(): number {
    let cleanedCount = 0;
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(this.prefix)) {
        try {
          const itemStr = localStorage.getItem(key);
          if (itemStr) {
            const item = JSON.parse(itemStr);
            if (Date.now() > item.expiresAt) {
              localStorage.removeItem(key);
              cleanedCount++;
            }
          }
        } catch (error) {
          localStorage.removeItem(key);
          cleanedCount++;
        }
      }
    });
    return cleanedCount;
  }
}
