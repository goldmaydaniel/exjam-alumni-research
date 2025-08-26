import { NextRequest, NextResponse } from 'next/server'
import { ApiError, handleUnknownError, isApiError } from '@/lib/errors/api-errors'
import { performanceMonitor } from '@/lib/monitoring/performance-monitor'
import { logger } from '@/lib/logging/logger'

export interface ErrorLogData {
  timestamp: string
  path: string
  method: string
  statusCode: number
  errorCode: string
  message: string
  userId?: string
  userAgent?: string
  ip?: string
  duration?: number
  stack?: string
}

/**
 * Global error handler middleware for API routes
 */
export function withErrorHandling<T>(
  handler: (req: NextRequest) => Promise<T>
) {
  return async function (req: NextRequest): Promise<NextResponse> {
    const startTime = Date.now()
    const requestId = crypto.randomUUID()
    const path = req.nextUrl.pathname
    const method = req.method
    const userAgent = req.headers.get('user-agent') || undefined
    const ip = getClientIP(req)
    
    // Create request logger
    const requestLogger = logger.child({
      requestId,
      endpoint: path,
      method,
      userAgent,
      ip
    })

    requestLogger.request('Request started')
    
    try {
      const result = await handler(req)
      const duration = Date.now() - startTime
      
      // Record successful request metrics
      performanceMonitor.recordRequest({
        requestId,
        endpoint: path,
        method,
        statusCode: 200,
        duration,
        userAgent,
        timestamp: new Date().toISOString()
      })

      requestLogger.response('Request completed', {
        statusCode: 200,
        duration
      })
      
      // If result is already a NextResponse, return it
      if (result instanceof NextResponse) {
        return result
      }
      
      // Otherwise, wrap in NextResponse
      return NextResponse.json(result)
    } catch (error) {
      const duration = Date.now() - startTime
      const apiError = handleUnknownError(error, path)
      
      // Record failed request metrics
      performanceMonitor.recordRequest({
        requestId,
        endpoint: path,
        method,
        statusCode: apiError.statusCode,
        duration,
        userAgent,
        userId: apiError.userId,
        timestamp: new Date().toISOString()
      })
      
      // Log error with structured logging
      requestLogger.error('Request failed', {
        statusCode: apiError.statusCode,
        errorCode: apiError.code,
        duration,
        userId: apiError.userId
      }, error as Error)

      // Log error details (legacy support)
      await logError({
        timestamp: new Date().toISOString(),
        path,
        method,
        statusCode: apiError.statusCode,
        errorCode: apiError.code,
        message: apiError.message,
        userId: apiError.userId,
        userAgent,
        ip,
        duration,
        stack: process.env.NODE_ENV === 'development' ? (error as Error)?.stack : undefined,
      })
      
      // Return structured error response
      const response = NextResponse.json(apiError.toJSON(), { 
        status: apiError.statusCode 
      })
      
      // Add error headers for debugging
      response.headers.set('X-Error-Code', apiError.code)
      response.headers.set('X-Error-Timestamp', apiError.timestamp)
      response.headers.set('X-Request-ID', requestId)
      
      return response
    }
  }
}

/**
 * Extract client IP from request
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
 * Log error to appropriate destination
 */
async function logError(errorData: ErrorLogData): Promise<void> {
  try {
    // In development, log to console with formatting
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 API Error:', {
        path: errorData.path,
        method: errorData.method,
        status: errorData.statusCode,
        code: errorData.errorCode,
        message: errorData.message,
        duration: `${errorData.duration}ms`,
        userId: errorData.userId || 'anonymous',
        ip: errorData.ip,
      })
      
      if (errorData.stack) {
        console.error('Stack trace:', errorData.stack)
      }
      
      return
    }
    
    // In production, you would send to external logging service
    // Examples: DataDog, LogRocket, Sentry, etc.
    
    // For now, structure for JSON logging
    const logEntry = {
      level: 'error',
      service: 'exjam-alumni-api',
      ...errorData,
    }
    
    // This would typically go to your logging service
    console.error(JSON.stringify(logEntry))
    
    // Optional: Send to external error tracking service
    // await sendToErrorTracker(logEntry)
    
  } catch (logError) {
    // Don't let logging errors crash the application
    console.error('Failed to log error:', logError)
  }
}

/**
 * Middleware for handling async route handlers with proper error handling
 */
export function createAsyncHandler<T>(
  handler: (req: NextRequest, context?: { params: any }) => Promise<T>
) {
  return withErrorHandling(handler)
}

/**
 * Validation middleware that converts validation errors to API errors
 */
export function withValidation<T>(
  schema: any,
  handler: (req: NextRequest, validatedData: T) => Promise<NextResponse>
) {
  return withErrorHandling(async (req: NextRequest) => {
    try {
      const body = await req.json()
      const validatedData = schema.parse(body)
      return await handler(req, validatedData)
    } catch (error) {
      // Zod errors will be handled by the error handler
      throw error
    }
  })
}

/**
 * Request context middleware that adds request metadata
 */
export interface RequestContext {
  requestId: string
  startTime: number
  path: string
  method: string
  userAgent?: string
  ip: string
}

export function withRequestContext<T>(
  handler: (req: NextRequest, context: RequestContext) => Promise<T>
) {
  return withErrorHandling(async (req: NextRequest) => {
    const context: RequestContext = {
      requestId: crypto.randomUUID(),
      startTime: Date.now(),
      path: req.nextUrl.pathname,
      method: req.method,
      userAgent: req.headers.get('user-agent') || undefined,
      ip: getClientIP(req),
    }
    
    return await handler(req, context)
  })
}

/**
 * Performance monitoring middleware
 */
export function withPerformanceMonitoring<T>(
  handler: (req: NextRequest) => Promise<T>
) {
  return withErrorHandling(async (req: NextRequest) => {
    const startTime = Date.now()
    const path = req.nextUrl.pathname
    const method = req.method
    
    try {
      const result = await handler(req)
      const duration = Date.now() - startTime
      
      // Log performance metrics
      if (duration > 1000) { // Log slow requests (>1s)
        console.warn('🐌 Slow API request:', {
          path,
          method,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString(),
        })
      }
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      
      // Add performance context to error
      if (isApiError(error)) {
        (error as any).duration = duration
      }
      
      throw error
    }
  })
}

/**
 * Health check middleware for API endpoints
 */
export async function healthCheck(req: NextRequest): Promise<NextResponse> {
  try {
    // Basic health checks
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: 'connected', // You would check actual DB connection
      cache: 'connected',     // You would check actual cache connection
    }
    
    return NextResponse.json(health)
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}

/**
 * CORS middleware for API endpoints
 */
export function withCors(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: {
    origin?: string | string[]
    methods?: string[]
    headers?: string[]
    credentials?: boolean
  } = {}
) {
  return async function (req: NextRequest): Promise<NextResponse> {
    const {
      origin = '*',
      methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      headers = ['Content-Type', 'Authorization'],
      credentials = true,
    } = options
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': Array.isArray(origin) ? origin.join(',') : origin,
          'Access-Control-Allow-Methods': methods.join(','),
          'Access-Control-Allow-Headers': headers.join(','),
          'Access-Control-Allow-Credentials': credentials.toString(),
        },
      })
    }
    
    const response = await handler(req)
    
    // Add CORS headers to actual response
    response.headers.set('Access-Control-Allow-Origin', Array.isArray(origin) ? origin.join(',') : origin)
    response.headers.set('Access-Control-Allow-Credentials', credentials.toString())
    
    return response
  }
}

export default withErrorHandling