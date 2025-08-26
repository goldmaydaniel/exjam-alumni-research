import { NextRequest } from "next/server";

// In-memory store for development (use Redis in production)
interface RateLimitData {
  count: number;
  resetTime: number;
  blocked?: boolean;
  blockUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitData>();

export interface RateLimitConfig {
  /** Maximum number of requests allowed */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Optional: Block duration after limit exceeded (in milliseconds) */
  blockDurationMs?: number;
  /** Optional: Custom key generator function */
  keyGenerator?: (req: NextRequest) => string;
  /** Optional: Skip function to bypass rate limiting */
  skip?: (req: NextRequest) => boolean;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
  error?: string;
}

/**
 * Rate limiting middleware for API endpoints
 */
export function rateLimit(config: RateLimitConfig) {
  const {
    maxRequests,
    windowMs,
    blockDurationMs = 0,
    keyGenerator = defaultKeyGenerator,
    skip,
  } = config;

  return async (req: NextRequest): Promise<RateLimitResult> => {
    // Skip rate limiting if skip function returns true
    if (skip && skip(req)) {
      return {
        success: true,
        limit: maxRequests,
        remaining: maxRequests,
        reset: new Date(Date.now() + windowMs),
      };
    }

    const key = keyGenerator(req);
    const now = Date.now();

    // Clean up expired entries periodically
    if (Math.random() < 0.01) {
      cleanupExpiredEntries(now);
    }

    let data = rateLimitStore.get(key);

    // Check if IP is currently blocked
    if (data?.blocked && data.blockUntil && now < data.blockUntil) {
      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        reset: new Date(data.blockUntil),
        error: `Too many requests. Try again after ${new Date(data.blockUntil).toISOString()}`,
      };
    }

    // Initialize or reset window
    if (!data || now >= data.resetTime) {
      data = {
        count: 0,
        resetTime: now + windowMs,
        blocked: false,
        blockUntil: undefined,
      };
    }

    // Increment request count
    data.count++;

    // Check if limit exceeded
    if (data.count > maxRequests) {
      if (blockDurationMs > 0) {
        data.blocked = true;
        data.blockUntil = now + blockDurationMs;
      }

      rateLimitStore.set(key, data);

      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        reset: new Date(data.resetTime),
        error:
          blockDurationMs > 0
            ? `Rate limit exceeded. Blocked until ${new Date(data.blockUntil!).toISOString()}`
            : "Rate limit exceeded. Please try again later.",
      };
    }

    // Update store
    rateLimitStore.set(key, data);

    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - data.count,
      reset: new Date(data.resetTime),
    };
  };
}

/**
 * Default key generator using IP address and User-Agent
 */
function defaultKeyGenerator(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0]
    : req.headers.get("x-real-ip") || req.ip || "unknown";

  const userAgent = req.headers.get("user-agent")?.slice(0, 50) || "unknown";

  return `${ip}:${userAgent}`;
}

/**
 * Generate key based on IP address only
 */
export function ipKeyGenerator(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0]
    : req.headers.get("x-real-ip") || req.ip || "unknown";

  return ip;
}

/**
 * Generate key based on user ID (for authenticated requests)
 */
export function userKeyGenerator(req: NextRequest): string {
  const auth = req.headers.get("authorization");
  const userId = extractUserIdFromToken(auth);

  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP if no user ID
  return ipKeyGenerator(req);
}

/**
 * Extract user ID from JWT token (simplified)
 */
function extractUserIdFromToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  try {
    const token = authHeader.slice(7);
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.userId || null;
  } catch {
    return null;
  }
}

/**
 * Clean up expired entries from memory store
 */
function cleanupExpiredEntries(now: number): void {
  for (const [key, data] of rateLimitStore.entries()) {
    if (now >= data.resetTime && (!data.blocked || !data.blockUntil || now >= data.blockUntil)) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Predefined rate limit configurations
 */
export const rateLimitConfigs = {
  /** Authentication endpoints (login, register, password reset) */
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 30 * 60 * 1000, // 30 minutes block
    keyGenerator: ipKeyGenerator,
  },

  /** Password reset specific - more restrictive */
  passwordReset: {
    maxRequests: 3,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 60 * 60 * 1000, // 1 hour block
    keyGenerator: ipKeyGenerator,
  },

  /** Payment endpoints */
  payment: {
    maxRequests: 10,
    windowMs: 10 * 60 * 1000, // 10 minutes
    blockDurationMs: 20 * 60 * 1000, // 20 minutes block
    keyGenerator: userKeyGenerator,
  },

  /** Registration endpoints */
  registration: {
    maxRequests: 3,
    windowMs: 5 * 60 * 1000, // 5 minutes
    blockDurationMs: 10 * 60 * 1000, // 10 minutes block
    keyGenerator: userKeyGenerator,
  },

  /** General API endpoints */
  api: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
    keyGenerator: defaultKeyGenerator,
  },

  /** Public endpoints (events list, etc.) */
  public: {
    maxRequests: 50,
    windowMs: 5 * 60 * 1000, // 5 minutes
    keyGenerator: ipKeyGenerator,
  },
} as const;

/**
 * Helper function to apply rate limiting to API routes
 */
export async function withRateLimit<T>(
  req: NextRequest,
  config: RateLimitConfig,
  handler: () => Promise<T>
): Promise<T> {
  const rateLimiter = rateLimit(config);
  const result = await rateLimiter(req);

  if (!result.success) {
    const error = new Error(result.error || "Rate limit exceeded");
    (error as any).status = 429;
    (error as any).headers = {
      "X-RateLimit-Limit": result.limit.toString(),
      "X-RateLimit-Remaining": result.remaining.toString(),
      "X-RateLimit-Reset": result.reset.toISOString(),
      "Retry-After": Math.ceil((result.reset.getTime() - Date.now()) / 1000).toString(),
    };
    throw error;
  }

  return handler();
}
