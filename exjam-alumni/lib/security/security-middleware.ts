/**
 * Comprehensive Security Middleware
 * Implements multiple layers of security protection
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logging/logger'
import { createError } from '@/lib/errors/api-errors'
import { rateLimiter, rateLimitConfigs } from '@/lib/security/rate-limiter'
import { CSP } from '@/lib/validation/validators'

export interface SecurityConfig {
  enableRateLimit?: boolean
  enableCSP?: boolean
  enableCORS?: boolean
  enableSecurityHeaders?: boolean
  enableRequestValidation?: boolean
  allowedOrigins?: string[]
  maxRequestSize?: number
}

const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  enableRateLimit: true,
  enableCSP: true,
  enableCORS: true,
  enableSecurityHeaders: true,
  enableRequestValidation: true,
  allowedOrigins: process.env.NODE_ENV === 'production' 
    ? [process.env.NEXT_PUBLIC_APP_URL || 'https://exjam-alumni.vercel.app']
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  maxRequestSize: 10 * 1024 * 1024 // 10MB
}

/**
 * Apply comprehensive security middleware
 */
export function withSecurity<T>(
  config: SecurityConfig = {},
  handler: (req: NextRequest, ...args: any[]) => Promise<T>
) {
  const securityConfig = { ...DEFAULT_SECURITY_CONFIG, ...config }
  
  return async function (req: NextRequest, ...args: any[]): Promise<T | NextResponse> {
    const startTime = Date.now()
    const requestId = crypto.randomUUID()
    
    try {
      // 1. Request size validation
      if (securityConfig.enableRequestValidation) {
        await validateRequestSize(req, securityConfig.maxRequestSize!)
      }

      // 2. Malicious request detection
      if (securityConfig.enableRequestValidation) {
        await detectMaliciousRequest(req)
      }

      // 3. Rate limiting
      if (securityConfig.enableRateLimit) {
        await applyRateLimit(req)
      }

      // Execute the handler
      const result = await handler(req, ...args)
      
      // 4. Apply security headers to response
      if (result instanceof NextResponse) {
        return applySecurityHeaders(result, securityConfig)
      }
      
      // If result is not a NextResponse, create one and apply headers
      const response = NextResponse.json(result)
      return applySecurityHeaders(response, securityConfig)

    } catch (error) {
      // Log security violations
      const duration = Date.now() - startTime
      
      logger.security('Security middleware blocked request', {
        requestId,
        endpoint: req.nextUrl.pathname,
        method: req.method,
        duration,
        userAgent: req.headers.get('user-agent'),
        ip: getClientIP(req),
        error: error instanceof Error ? error.message : String(error)
      })
      
      throw error
    }
  }
}

/**
 * Validate request size to prevent DoS attacks
 */
async function validateRequestSize(req: NextRequest, maxSize: number): Promise<void> {
  const contentLength = req.headers.get('content-length')
  
  if (contentLength && parseInt(contentLength) > maxSize) {
    throw createError.validation(
      [{ field: 'request', constraint: 'size', expected: `<= ${maxSize} bytes` }],
      'Request size exceeds maximum allowed',
      req.nextUrl.pathname
    )
  }
}

/**
 * Detect malicious request patterns
 */
async function detectMaliciousRequest(req: NextRequest): Promise<void> {
  const url = req.url
  const userAgent = req.headers.get('user-agent') || ''
  const referer = req.headers.get('referer') || ''
  
  // Check for suspicious URL patterns
  const suspiciousPatterns = [
    // SQL injection attempts
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|UNION)\b.*\b(FROM|WHERE|INTO)\b)/i,
    /(['"])((\\\1|.)*?)\1/,
    /(;|--|\/\*|\*\/)/,
    
    // XSS attempts
    /<script[^>]*>.*?<\/script>/i,
    /javascript:/i,
    /vbscript:/i,
    /on(load|error|click|focus|blur|change|submit)=/i,
    
    // Path traversal
    /\.\.(\/|\\)/,
    /(\.\.%2f|\.\.%5c)/i,
    
    // Command injection
    /(\||&|;|`|\$\(|\$\{)/,
    
    // File inclusion
    /\b(php|asp|jsp|cfm):/i,
    /\b(file|http|https|ftp):\/\//i,
    
    // Common attack patterns
    /\b(union|select|script|alert|eval|expression)\b/i
  ]
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url) || pattern.test(userAgent) || pattern.test(referer)) {
      logger.security('Malicious request pattern detected', {
        pattern: pattern.source,
        url: req.url,
        userAgent,
        referer,
        ip: getClientIP(req)
      })
      
      throw createError.validation(
        [{ field: 'request', constraint: 'security', expected: 'safe content' }],
        'Request contains suspicious content',
        req.nextUrl.pathname
      )
    }
  }
  
  // Check for bot patterns (adjust as needed)
  const botPatterns = [
    /bot|crawler|spider|scraper/i,
    /curl|wget|postman|insomnia/i,
    /python|java|go-http-client/i
  ]
  
  // Log potential bot activity (don't block, just monitor)
  if (botPatterns.some(pattern => pattern.test(userAgent))) {
    logger.security('Potential bot activity detected', {
      userAgent,
      endpoint: req.nextUrl.pathname,
      method: req.method,
      ip: getClientIP(req)
    })
  }
}

/**
 * Apply rate limiting based on endpoint
 */
async function applyRateLimit(req: NextRequest): Promise<void> {
  const pathname = req.nextUrl.pathname
  
  // Determine rate limit config based on endpoint
  let config = rateLimitConfigs.public
  
  if (pathname.startsWith('/api/auth')) {
    config = rateLimitConfigs.auth
  } else if (pathname.startsWith('/api/admin')) {
    config = rateLimitConfigs.admin
  } else if (pathname.includes('/register') || pathname.includes('/registration')) {
    config = rateLimitConfigs.eventRegistration
  } else if (pathname.includes('/contact')) {
    config = rateLimitConfigs.contactForm
  }
  
  const key = config.keyGenerator ? config.keyGenerator(req) : getClientIP(req)
  const result = rateLimiter.checkLimit(key, config)
  
  if (!result.allowed) {
    throw createError.rateLimitExceeded(
      config.maxRequests,
      config.windowMs,
      req.nextUrl.pathname
    )
  }
}

/**
 * Apply security headers to response
 */
function applySecurityHeaders(response: NextResponse, config: SecurityConfig): NextResponse {
  if (!config.enableSecurityHeaders) return response
  
  // Content Security Policy
  if (config.enableCSP) {
    const nonce = CSP.generateNonce()
    response.headers.set('Content-Security-Policy', CSP.buildHeader(nonce))
  }
  
  // CORS headers
  if (config.enableCORS && config.allowedOrigins) {
    const origin = response.headers.get('origin') || '*'
    const allowedOrigin = config.allowedOrigins.includes(origin) ? origin : config.allowedOrigins[0]
    
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Max-Age', '86400')
  }
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), location=(), notifications=()')
  
  // HSTS (only in production with HTTPS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }
  
  // Remove server information
  response.headers.delete('Server')
  response.headers.delete('X-Powered-By')
  
  return response
}

/**
 * Get client IP address
 */
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIP = req.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  return req.ip || 'unknown'
}

/**
 * CSRF protection middleware
 */
export function withCSRFProtection<T>(
  handler: (req: NextRequest, ...args: any[]) => Promise<T>
) {
  return async function (req: NextRequest, ...args: any[]): Promise<T> {
    // Only check CSRF for state-changing operations
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const origin = req.headers.get('origin')
      const referer = req.headers.get('referer')
      const host = req.headers.get('host')
      
      // Check origin/referer against allowed hosts
      const allowedHosts = [
        host,
        process.env.NEXT_PUBLIC_APP_URL?.replace(/https?:\/\//, ''),
        'localhost:3000',
        '127.0.0.1:3000'
      ].filter(Boolean)
      
      const isValidOrigin = origin && allowedHosts.some(allowedHost => 
        origin.includes(allowedHost!)
      )
      
      const isValidReferer = referer && allowedHosts.some(allowedHost =>
        referer.includes(allowedHost!)
      )
      
      if (!isValidOrigin && !isValidReferer) {
        logger.security('CSRF attack attempt detected', {
          origin,
          referer,
          host,
          endpoint: req.nextUrl.pathname,
          method: req.method,
          ip: getClientIP(req)
        })
        
        throw createError.forbidden(
          'CSRF token validation failed',
          req.nextUrl.pathname
        )
      }
    }
    
    return await handler(req, ...args)
  }
}

/**
 * Input sanitization middleware
 */
export function withInputSanitization<T>(
  handler: (req: NextRequest, ...args: any[]) => Promise<T>
) {
  return async function (req: NextRequest, ...args: any[]): Promise<T> {
    // Only sanitize for requests with body
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      try {
        const body = await req.json()
        const sanitizedBody = sanitizeObject(body)
        
        // Replace request body with sanitized version
        const sanitizedReq = new Proxy(req, {
          get(target, prop) {
            if (prop === 'json') {
              return () => Promise.resolve(sanitizedBody)
            }
            return (target as any)[prop]
          }
        })
        
        return await handler(sanitizedReq as NextRequest, ...args)
      } catch (error) {
        // If JSON parsing fails, continue with original request
        return await handler(req, ...args)
      }
    }
    
    return await handler(req, ...args)
  }
}

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj)
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject)
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value)
    }
    return sanitized
  }
  
  return obj
}

/**
 * Sanitize string input
 */
function sanitizeString(input: string): string {
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/\0/g, '') // Remove null bytes
    .trim()
}

/**
 * Honeypot field validation (bot detection)
 */
export function validateHoneypot(data: any, honeypotField: string = 'honeypot'): void {
  if (data[honeypotField] && data[honeypotField].length > 0) {
    logger.security('Bot detected via honeypot field', {
      honeypotValue: data[honeypotField],
      timestamp: new Date().toISOString()
    })
    
    throw createError.validation(
      [{ field: honeypotField, constraint: 'empty', expected: 'empty string' }],
      'Bot detection triggered',
      '/api/security'
    )
  }
}

/**
 * Export combined security middleware
 */
export function withCompleteSecurity<T>(
  config: SecurityConfig = {},
  handler: (req: NextRequest, ...args: any[]) => Promise<T>
) {
  return withSecurity(
    config,
    withCSRFProtection(
      withInputSanitization(handler)
    )
  )
}

export default {
  withSecurity,
  withCSRFProtection,
  withInputSanitization,
  withCompleteSecurity,
  validateHoneypot
}