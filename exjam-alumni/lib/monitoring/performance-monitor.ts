/**
 * Performance Monitoring System
 * Tracks API response times, cache performance, and system metrics
 */

export interface PerformanceMetrics {
  requestId: string
  endpoint: string
  method: string
  statusCode: number
  duration: number
  userAgent?: string
  userId?: string
  cacheHit?: boolean
  cacheKey?: string
  dbQueryCount?: number
  dbQueryTime?: number
  memoryUsage?: NodeJS.MemoryUsage
  timestamp: string
}

export interface DatabaseMetrics {
  queryCount: number
  totalQueryTime: number
  slowQueries: Array<{
    sql: string
    duration: number
    timestamp: string
  }>
}

export interface CacheMetrics {
  hits: number
  misses: number
  hitRate: number
  totalRequests: number
  averageResponseTime: number
  keysByPattern: Record<string, number>
}

export interface SystemMetrics {
  memoryUsage: NodeJS.MemoryUsage
  uptime: number
  activeConnections: number
  requestsPerMinute: number
  errorRate: number
  averageResponseTime: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private dbMetrics: DatabaseMetrics = {
    queryCount: 0,
    totalQueryTime: 0,
    slowQueries: []
  }
  private cacheMetrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalRequests: 0,
    averageResponseTime: 0,
    keysByPattern: {}
  }
  private requestCounts: Map<string, number> = new Map()
  private readonly SLOW_QUERY_THRESHOLD = 1000 // 1 second
  private readonly MAX_STORED_METRICS = 10000

  /**
   * Record API request performance metrics
   */
  recordRequest(metrics: PerformanceMetrics): void {
    // Add to metrics array
    this.metrics.push(metrics)

    // Keep only recent metrics to prevent memory bloat
    if (this.metrics.length > this.MAX_STORED_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_STORED_METRICS / 2)
    }

    // Track requests per endpoint
    const key = `${metrics.method}:${metrics.endpoint}`
    this.requestCounts.set(key, (this.requestCounts.get(key) || 0) + 1)

    // Log slow requests
    if (metrics.duration > this.SLOW_QUERY_THRESHOLD) {
      console.warn('🐌 Slow API Request:', {
        endpoint: metrics.endpoint,
        method: metrics.method,
        duration: `${metrics.duration}ms`,
        requestId: metrics.requestId,
        userId: metrics.userId || 'anonymous'
      })
    }
  }

  /**
   * Record database query performance
   */
  recordDbQuery(sql: string, duration: number): void {
    this.dbMetrics.queryCount++
    this.dbMetrics.totalQueryTime += duration

    // Track slow queries
    if (duration > this.SLOW_QUERY_THRESHOLD) {
      this.dbMetrics.slowQueries.push({
        sql: sql.substring(0, 200) + (sql.length > 200 ? '...' : ''),
        duration,
        timestamp: new Date().toISOString()
      })

      // Keep only recent slow queries
      if (this.dbMetrics.slowQueries.length > 100) {
        this.dbMetrics.slowQueries = this.dbMetrics.slowQueries.slice(-50)
      }

      console.warn('🐌 Slow Database Query:', {
        duration: `${duration}ms`,
        sql: sql.substring(0, 100) + '...'
      })
    }
  }

  /**
   * Record cache performance
   */
  recordCacheHit(key: string, responseTime: number): void {
    this.cacheMetrics.hits++
    this.cacheMetrics.totalRequests++
    this.updateCacheMetrics(key, responseTime)
  }

  recordCacheMiss(key: string, responseTime: number): void {
    this.cacheMetrics.misses++
    this.cacheMetrics.totalRequests++
    this.updateCacheMetrics(key, responseTime)
  }

  private updateCacheMetrics(key: string, responseTime: number): void {
    // Update hit rate
    this.cacheMetrics.hitRate = this.cacheMetrics.totalRequests > 0
      ? (this.cacheMetrics.hits / this.cacheMetrics.totalRequests) * 100
      : 0

    // Update average response time
    const totalTime = this.cacheMetrics.averageResponseTime * (this.cacheMetrics.totalRequests - 1) + responseTime
    this.cacheMetrics.averageResponseTime = totalTime / this.cacheMetrics.totalRequests

    // Track key patterns
    const pattern = this.extractKeyPattern(key)
    this.cacheMetrics.keysByPattern[pattern] = (this.cacheMetrics.keysByPattern[pattern] || 0) + 1
  }

  private extractKeyPattern(key: string): string {
    // Extract pattern from cache key (replace IDs with placeholders)
    return key
      .replace(/:[a-f0-9-]{36}/g, ':uuid')
      .replace(/:\d+/g, ':id')
      .replace(/:[^:]+@[^:]+/g, ':email')
  }

  /**
   * Get current system metrics
   */
  getSystemMetrics(): SystemMetrics {
    const now = Date.now()
    const oneMinuteAgo = now - 60000
    
    // Get recent metrics
    const recentMetrics = this.metrics.filter(
      m => new Date(m.timestamp).getTime() > oneMinuteAgo
    )

    // Calculate error rate
    const errorCount = recentMetrics.filter(m => m.statusCode >= 400).length
    const errorRate = recentMetrics.length > 0 
      ? (errorCount / recentMetrics.length) * 100 
      : 0

    // Calculate average response time
    const avgResponseTime = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length
      : 0

    return {
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      activeConnections: 0, // Would need to implement with actual connection tracking
      requestsPerMinute: recentMetrics.length,
      errorRate,
      averageResponseTime: Math.round(avgResponseTime)
    }
  }

  /**
   * Get database performance metrics
   */
  getDatabaseMetrics(): DatabaseMetrics & {
    averageQueryTime: number
    queriesPerSecond: number
  } {
    const avgQueryTime = this.dbMetrics.queryCount > 0
      ? this.dbMetrics.totalQueryTime / this.dbMetrics.queryCount
      : 0

    const queriesPerSecond = this.dbMetrics.queryCount / process.uptime()

    return {
      ...this.dbMetrics,
      averageQueryTime: Math.round(avgQueryTime),
      queriesPerSecond: Math.round(queriesPerSecond)
    }
  }

  /**
   * Get cache performance metrics
   */
  getCacheMetrics(): CacheMetrics {
    return { ...this.cacheMetrics }
  }

  /**
   * Get endpoint performance summary
   */
  getEndpointMetrics(limit: number = 20): Array<{
    endpoint: string
    method: string
    requestCount: number
    averageResponseTime: number
    errorRate: number
    p95ResponseTime: number
  }> {
    const endpointStats = new Map<string, {
      durations: number[]
      errors: number
      count: number
    }>()

    // Aggregate metrics by endpoint
    for (const metric of this.metrics) {
      const key = `${metric.method}:${metric.endpoint}`
      if (!endpointStats.has(key)) {
        endpointStats.set(key, { durations: [], errors: 0, count: 0 })
      }
      
      const stats = endpointStats.get(key)!
      stats.durations.push(metric.duration)
      stats.count++
      
      if (metric.statusCode >= 400) {
        stats.errors++
      }
    }

    // Calculate statistics
    const results = Array.from(endpointStats.entries()).map(([key, stats]) => {
      const [method, endpoint] = key.split(':', 2)
      const sortedDurations = stats.durations.sort((a, b) => a - b)
      const p95Index = Math.floor(sortedDurations.length * 0.95)
      
      return {
        endpoint,
        method,
        requestCount: stats.count,
        averageResponseTime: Math.round(
          stats.durations.reduce((sum, d) => sum + d, 0) / stats.durations.length
        ),
        errorRate: (stats.errors / stats.count) * 100,
        p95ResponseTime: sortedDurations[p95Index] || 0
      }
    })

    // Sort by request count and return top results
    return results
      .sort((a, b) => b.requestCount - a.requestCount)
      .slice(0, limit)
  }

  /**
   * Generate performance report
   */
  generateReport(): {
    system: SystemMetrics
    database: ReturnType<PerformanceMonitor['getDatabaseMetrics']>
    cache: CacheMetrics
    endpoints: ReturnType<PerformanceMonitor['getEndpointMetrics']>
    summary: {
      totalRequests: number
      healthScore: number
      recommendations: string[]
    }
  } {
    const system = this.getSystemMetrics()
    const database = this.getDatabaseMetrics()
    const cache = this.getCacheMetrics()
    const endpoints = this.getEndpointMetrics(10)

    // Calculate health score (0-100)
    let healthScore = 100
    if (system.errorRate > 5) healthScore -= 20
    if (system.averageResponseTime > 1000) healthScore -= 15
    if (cache.hitRate < 70) healthScore -= 10
    if (database.averageQueryTime > 500) healthScore -= 15
    if (system.memoryUsage.heapUsed / system.memoryUsage.heapTotal > 0.9) healthScore -= 10

    // Generate recommendations
    const recommendations: string[] = []
    if (system.errorRate > 5) recommendations.push('High error rate detected - investigate failing endpoints')
    if (system.averageResponseTime > 1000) recommendations.push('Response times are slow - consider optimization')
    if (cache.hitRate < 70) recommendations.push('Cache hit rate is low - review caching strategy')
    if (database.averageQueryTime > 500) recommendations.push('Database queries are slow - add indexes or optimize queries')
    if (database.slowQueries.length > 10) recommendations.push('Multiple slow queries detected - optimize database performance')

    return {
      system,
      database,
      cache,
      endpoints,
      summary: {
        totalRequests: this.metrics.length,
        healthScore: Math.max(0, healthScore),
        recommendations
      }
    }
  }

  /**
   * Clear old metrics to free memory
   */
  cleanup(): void {
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString()
    this.metrics = this.metrics.filter(m => m.timestamp > oneHourAgo)
    
    // Keep only recent slow queries
    this.dbMetrics.slowQueries = this.dbMetrics.slowQueries.slice(-50)
  }
}

export const performanceMonitor = new PerformanceMonitor()

/**
 * Middleware wrapper for automatic performance tracking
 */
export function withPerformanceTracking<T>(
  handler: (req: any, ...args: any[]) => Promise<T>,
  endpointName?: string
) {
  return async function (req: any, ...args: any[]): Promise<T> {
    const startTime = Date.now()
    const requestId = crypto.randomUUID()
    const endpoint = endpointName || req.nextUrl?.pathname || 'unknown'
    
    try {
      const result = await handler(req, ...args)
      const duration = Date.now() - startTime
      
      // Record successful request
      performanceMonitor.recordRequest({
        requestId,
        endpoint,
        method: req.method || 'GET',
        statusCode: 200,
        duration,
        userAgent: req.headers?.get('user-agent') || undefined,
        timestamp: new Date().toISOString()
      })
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      
      // Record failed request
      performanceMonitor.recordRequest({
        requestId,
        endpoint,
        method: req.method || 'GET',
        statusCode: 500,
        duration,
        userAgent: req.headers?.get('user-agent') || undefined,
        timestamp: new Date().toISOString()
      })
      
      throw error
    }
  }
}

// Cleanup old metrics every hour
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    performanceMonitor.cleanup()
  }, 3600000) // 1 hour
}