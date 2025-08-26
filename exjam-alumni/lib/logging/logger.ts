/**
 * Comprehensive Logging System
 * Provides structured logging with different levels and contexts
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

export interface LogContext {
  userId?: string
  requestId?: string
  endpoint?: string
  method?: string
  userAgent?: string
  ip?: string
  duration?: number
  statusCode?: number
  [key: string]: any
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
  service: string
  environment: string
}

class Logger {
  private readonly service: string = 'exjam-alumni'
  private readonly environment: string = process.env.NODE_ENV || 'development'
  private readonly logLevel: LogLevel

  constructor() {
    // Set log level based on environment
    const levelMap: Record<string, LogLevel> = {
      'production': LogLevel.WARN,
      'staging': LogLevel.INFO,
      'development': LogLevel.DEBUG,
      'test': LogLevel.ERROR
    }
    
    this.logLevel = levelMap[this.environment] ?? LogLevel.INFO
  }

  /**
   * Log error messages
   */
  error(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error)
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context)
  }

  /**
   * Log info messages
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context)
  }

  /**
   * Log debug messages
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context)
  }

  /**
   * Log trace messages
   */
  trace(message: string, context?: LogContext): void {
    this.log(LogLevel.TRACE, message, context)
  }

  /**
   * Log API requests
   */
  request(message: string, context: LogContext): void {
    this.info(`📡 ${message}`, {
      ...context,
      category: 'api-request'
    })
  }

  /**
   * Log API responses
   */
  response(message: string, context: LogContext): void {
    const emoji = context.statusCode && context.statusCode >= 400 ? '❌' : '✅'
    this.info(`${emoji} ${message}`, {
      ...context,
      category: 'api-response'
    })
  }

  /**
   * Log database operations
   */
  database(message: string, context: LogContext): void {
    this.debug(`🗄️ ${message}`, {
      ...context,
      category: 'database'
    })
  }

  /**
   * Log cache operations
   */
  cache(message: string, context: LogContext): void {
    this.debug(`⚡ ${message}`, {
      ...context,
      category: 'cache'
    })
  }

  /**
   * Log authentication events
   */
  auth(message: string, context: LogContext): void {
    this.info(`🔐 ${message}`, {
      ...context,
      category: 'authentication'
    })
  }

  /**
   * Log business logic events
   */
  business(message: string, context: LogContext): void {
    this.info(`💼 ${message}`, {
      ...context,
      category: 'business-logic'
    })
  }

  /**
   * Log security events
   */
  security(message: string, context: LogContext): void {
    this.warn(`🛡️ ${message}`, {
      ...context,
      category: 'security'
    })
  }

  /**
   * Log performance events
   */
  performance(message: string, context: LogContext): void {
    const emoji = context.duration && context.duration > 1000 ? '🐌' : '⚡'
    this.info(`${emoji} ${message}`, {
      ...context,
      category: 'performance'
    })
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    // Skip if log level is below threshold
    if (level > this.logLevel) {
      return
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      service: this.service,
      environment: this.environment
    }

    // Add error details if provided
    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: this.environment === 'development' ? error.stack : undefined
      }
    }

    // Output log based on environment
    if (this.environment === 'development') {
      this.consoleLog(logEntry)
    } else {
      this.structuredLog(logEntry)
    }
  }

  /**
   * Pretty console logging for development
   */
  private consoleLog(entry: LogEntry): void {
    const levelColors: Record<LogLevel, string> = {
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.INFO]: '\x1b[36m',  // Cyan
      [LogLevel.DEBUG]: '\x1b[32m', // Green
      [LogLevel.TRACE]: '\x1b[35m'  // Magenta
    }

    const levelNames: Record<LogLevel, string> = {
      [LogLevel.ERROR]: 'ERROR',
      [LogLevel.WARN]: 'WARN ',
      [LogLevel.INFO]: 'INFO ',
      [LogLevel.DEBUG]: 'DEBUG',
      [LogLevel.TRACE]: 'TRACE'
    }

    const color = levelColors[entry.level]
    const reset = '\x1b[0m'
    const levelName = levelNames[entry.level]
    const timestamp = new Date(entry.timestamp).toLocaleTimeString()

    console.log(`${color}[${levelName}]${reset} ${timestamp} ${entry.message}`)

    // Log context if provided
    if (entry.context && Object.keys(entry.context).length > 0) {
      console.log('  Context:', entry.context)
    }

    // Log error if provided
    if (entry.error) {
      console.log('  Error:', entry.error.message)
      if (entry.error.stack && entry.level === LogLevel.ERROR) {
        console.log(entry.error.stack)
      }
    }
  }

  /**
   * Structured JSON logging for production
   */
  private structuredLog(entry: LogEntry): void {
    // In production, you would send this to your logging service
    // Examples: DataDog, LogRocket, CloudWatch, etc.
    
    const logOutput = {
      '@timestamp': entry.timestamp,
      level: LogLevel[entry.level].toLowerCase(),
      message: entry.message,
      service: entry.service,
      environment: entry.environment,
      ...entry.context,
      ...(entry.error && {
        error: entry.error
      })
    }

    // Output as JSON for log aggregation services
    console.log(JSON.stringify(logOutput))
  }

  /**
   * Create child logger with default context
   */
  child(defaultContext: LogContext): Logger {
    const childLogger = Object.create(this)
    const originalLog = this.log.bind(this)
    
    childLogger.log = (level: LogLevel, message: string, context?: LogContext, error?: Error) => {
      const mergedContext = { ...defaultContext, ...context }
      originalLog(level, message, mergedContext, error)
    }
    
    return childLogger
  }

  /**
   * Log request/response cycle
   */
  requestCycle(
    requestContext: LogContext,
    responseContext: LogContext,
    duration: number
  ): void {
    const statusCode = responseContext.statusCode || 200
    const isError = statusCode >= 400
    
    const message = `${requestContext.method} ${requestContext.endpoint} - ${statusCode} (${duration}ms)`
    
    const fullContext = {
      ...requestContext,
      ...responseContext,
      duration,
      category: 'request-cycle'
    }

    if (isError) {
      this.error(message, fullContext)
    } else if (duration > 1000) {
      this.warn(`Slow request: ${message}`, fullContext)
    } else {
      this.info(message, fullContext)
    }
  }
}

// Create global logger instance
export const logger = new Logger()

/**
 * Request logging middleware
 */
export function withRequestLogging<T>(
  handler: (req: any, ...args: any[]) => Promise<T>,
  endpointName?: string
) {
  return async function (req: any, ...args: any[]): Promise<T> {
    const requestId = crypto.randomUUID()
    const startTime = Date.now()
    
    const requestContext: LogContext = {
      requestId,
      endpoint: endpointName || req.nextUrl?.pathname || 'unknown',
      method: req.method || 'GET',
      userAgent: req.headers?.get('user-agent') || undefined,
      ip: req.headers?.get('x-forwarded-for') || req.ip || 'unknown'
    }

    // Create child logger for this request
    const requestLogger = logger.child(requestContext)
    
    requestLogger.request('Request started', requestContext)
    
    try {
      const result = await handler(req, ...args)
      const duration = Date.now() - startTime
      
      requestLogger.response('Request completed', {
        statusCode: 200,
        duration
      })
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      
      requestLogger.error('Request failed', {
        statusCode: 500,
        duration
      }, error as Error)
      
      throw error
    }
  }
}

// Export specific loggers for different concerns
export const apiLogger = logger.child({ category: 'api' })
export const dbLogger = logger.child({ category: 'database' })
export const cacheLogger = logger.child({ category: 'cache' })
export const authLogger = logger.child({ category: 'auth' })
export const businessLogger = logger.child({ category: 'business' })
export const securityLogger = logger.child({ category: 'security' })
export const performanceLogger = logger.child({ category: 'performance' })