/**
 * Advanced Rate Limiting System
 * Implements multiple rate limiting strategies with enhanced security
 */

import { logger } from '@/lib/logging/logger'
import { createError } from '@/lib/errors/api-errors'

export interface RateLimitConfig {
  windowMs: number           // Time window in milliseconds
  maxRequests: number        // Maximum requests per window
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (req: any) => string
  onLimitReached?: (key: string, req: any) => void
}

export interface RateLimitResult {
  allowed: boolean
  resetTime: number
  remaining: number
  total: number
}

interface RateLimitEntry {
  count: number
  resetTime: number
  firstRequest: number
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  /**
   * Check if request is within rate limit
   */
  checkLimit(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now()
    const windowStart = now - config.windowMs
    
    // Get or create entry
    let entry = this.store.get(key)
    
    if (!entry || entry.resetTime <= now) {
      // Create new entry or reset expired one
      entry = {
        count: 1,
        resetTime: now + config.windowMs,
        firstRequest: now
      }
      this.store.set(key, entry)
      
      return {
        allowed: true,
        resetTime: entry.resetTime,
        remaining: config.maxRequests - 1,
        total: config.maxRequests
      }
    }
    
    // Check if within limits
    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        resetTime: entry.resetTime,
        remaining: 0,
        total: config.maxRequests
      }
    }
    
    // Increment counter
    entry.count++
    this.store.set(key, entry)
    
    return {
      allowed: true,
      resetTime: entry.resetTime,
      remaining: config.maxRequests - entry.count,
      total: config.maxRequests
    }
  }

  /**
   * Get current rate limit status without incrementing
   */
  getStatus(key: string, config: RateLimitConfig): RateLimitResult {
    const entry = this.store.get(key)
    
    if (!entry) {
      return {
        allowed: true,
        resetTime: Date.now() + config.windowMs,
        remaining: config.maxRequests,
        total: config.maxRequests
      }
    }
    
    const now = Date.now()
    if (entry.resetTime <= now) {
      return {
        allowed: true,
        resetTime: now + config.windowMs,
        remaining: config.maxRequests,
        total: config.maxRequests
      }
    }
    
    return {
      allowed: entry.count < config.maxRequests,
      resetTime: entry.resetTime,
      remaining: Math.max(0, config.maxRequests - entry.count),
      total: config.maxRequests
    }
  }

  /**
   * Reset rate limit for specific key
   */
  reset(key: string): void {
    this.store.delete(key)
  }

  /**
   * Get all current rate limit entries (for monitoring)
   */
  getAll(): Array<{ key: string; entry: RateLimitEntry }> {
    return Array.from(this.store.entries()).map(([key, entry]) => ({
      key,
      entry
    }))
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    let cleaned = 0
    
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime <= now) {
        this.store.delete(key)
        cleaned++
      }
    }
    
    if (cleaned > 0) {
      logger.debug(`Rate limiter cleanup: removed ${cleaned} expired entries`)
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter()

/**
 * Default rate limit configurations
 */
export const rateLimitConfigs = {
  // Public API endpoints
  public: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    keyGenerator: (req: any) => getClientKey(req)
  },
  
  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 20,
    keyGenerator: (req: any) => getClientKey(req)
  },
  
  // Admin endpoints
  admin: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 200,
    keyGenerator: (req: any) => getUserKey(req)
  },
  
  // Event registration (more restrictive)
  eventRegistration: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 5,
    keyGenerator: (req: any) => getUserKey(req) || getClientKey(req)
  },
  
  // Password reset attempts
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    keyGenerator: (req: any) => getClientKey(req)
  },
  
  // Contact form submissions
  contactForm: {
    windowMs: 30 * 60 * 1000, // 30 minutes
    maxRequests: 5,
    keyGenerator: (req: any) => getClientKey(req)
  }
} as const

/**
 * Get client identifier for rate limiting
 */
function getClientKey(req: any): string {
  // Try to get IP address
  const forwarded = req.headers?.get?.('x-forwarded-for')
  const realIp = req.headers?.get?.('x-real-ip')
  const ip = forwarded?.split(',')[0]?.trim() || realIp || req.ip || 'unknown'
  
  // Include user agent hash for better uniqueness
  const userAgent = req.headers?.get?.('user-agent') || ''
  const userAgentHash = hashString(userAgent).substring(0, 8)
  
  return `ip:${ip}:${userAgentHash}`
}

/**
 * Get user identifier for authenticated requests
 */
function getUserKey(req: any): string | null {
  // This would be set by authentication middleware
  const userId = req.userId || req.user?.id
  return userId ? `user:${userId}` : null
}

/**
 * Simple hash function for strings
 */
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * Rate limiting middleware
 */
export function withRateLimit<T>(
  config: RateLimitConfig,
  handler: (req: any, ...args: any[]) => Promise<T>
) {
  return async function (req: any, ...args: any[]): Promise<T> {
    const key = config.keyGenerator ? config.keyGenerator(req) : getClientKey(req)
    const result = rateLimiter.checkLimit(key, config)
    
    if (!result.allowed) {
      // Log rate limit exceeded
      logger.security('Rate limit exceeded', {
        key,
        endpoint: req.nextUrl?.pathname,
        method: req.method,
        resetTime: new Date(result.resetTime).toISOString(),
        userAgent: req.headers?.get?.('user-agent'),
        ip: getClientKey(req)
      })
      
      // Call optional callback
      config.onLimitReached?.(key, req)
      
      // Throw rate limit error
      throw createError.rateLimitExceeded(
        config.maxRequests,
        config.windowMs,
        req.nextUrl?.pathname
      )
    }
    
    // Execute handler
    return await handler(req, ...args)
  }
}

/**
 * Express-style rate limiting middleware
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return (req: any, res: any, next: any) => {
    const key = config.keyGenerator ? config.keyGenerator(req) : getClientKey(req)
    const result = rateLimiter.checkLimit(key, config)
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', config.maxRequests)
    res.setHeader('X-RateLimit-Remaining', result.remaining)
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000))
    
    if (!result.allowed) {
      res.setHeader('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000))
      
      logger.security('Rate limit exceeded', {
        key,
        endpoint: req.url,
        method: req.method,
        resetTime: new Date(result.resetTime).toISOString()
      })
      
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many requests. Limit: ${config.maxRequests} per ${config.windowMs}ms`,
          resetTime: new Date(result.resetTime).toISOString()
        }
      })
    }
    
    next()
  }
}

/**
 * Advanced rate limiting with multiple tiers
 */
export class TieredRateLimiter {
  private limiters: Array<{ limiter: RateLimiter; config: RateLimitConfig; name: string }> = []
  
  addTier(name: string, config: RateLimitConfig): this {
    this.limiters.push({
      limiter: new RateLimiter(),
      config,
      name
    })
    return this
  }
  
  checkLimits(req: any): { allowed: boolean; tier?: string; result?: RateLimitResult } {
    for (const { limiter, config, name } of this.limiters) {
      const key = config.keyGenerator ? config.keyGenerator(req) : getClientKey(req)
      const result = limiter.checkLimit(key, config)
      
      if (!result.allowed) {
        return {
          allowed: false,
          tier: name,
          result
        }
      }
    }
    
    return { allowed: true }
  }
}

/**
 * Create tiered rate limiter for different user types
 */
export function createTieredLimiter() {
  return new TieredRateLimiter()
    .addTier('anonymous', {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 50,
      keyGenerator: getClientKey
    })
    .addTier('authenticated', {
      windowMs: 15 * 60 * 1000, // 15 minutes  
      maxRequests: 200,
      keyGenerator: (req) => getUserKey(req) || getClientKey(req)
    })
    .addTier('premium', {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 500,
      keyGenerator: (req) => getUserKey(req) || getClientKey(req)
    })
}

// Export singleton instance
export { rateLimiter as default }