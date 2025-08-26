import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/auth-middleware'
import { withErrorHandling } from '@/lib/middleware/error-middleware'
import { performanceMonitor } from '@/lib/monitoring/performance-monitor'
import { createError } from '@/lib/errors/api-errors'
import { z } from 'zod'

const monitoringQuerySchema = z.object({
  type: z.enum(['system', 'database', 'cache', 'endpoints', 'full']).default('system'),
  limit: z.coerce.number().min(1).max(100).default(20)
})

/**
 * GET /api/admin/monitoring
 * Get system monitoring data and performance metrics
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  return withAuth(['ADMIN'], async (user) => {
    const { searchParams } = new URL(req.url)
    const query = monitoringQuerySchema.parse({
      type: searchParams.get('type'),
      limit: searchParams.get('limit')
    })

    switch (query.type) {
      case 'system':
        return NextResponse.json({
          metrics: performanceMonitor.getSystemMetrics(),
          timestamp: new Date().toISOString()
        })

      case 'database':
        return NextResponse.json({
          metrics: performanceMonitor.getDatabaseMetrics(),
          timestamp: new Date().toISOString()
        })

      case 'cache':
        return NextResponse.json({
          metrics: performanceMonitor.getCacheMetrics(),
          timestamp: new Date().toISOString()
        })

      case 'endpoints':
        return NextResponse.json({
          metrics: performanceMonitor.getEndpointMetrics(query.limit),
          timestamp: new Date().toISOString()
        })

      case 'full':
      default:
        return NextResponse.json({
          report: performanceMonitor.generateReport(),
          timestamp: new Date().toISOString()
        })
    }
  })(req)
})

/**
 * POST /api/admin/monitoring/cleanup
 * Cleanup old performance metrics
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  return withAuth(['ADMIN'], async (user) => {
    const body = await req.json()
    
    if (body.action === 'cleanup') {
      performanceMonitor.cleanup()
      
      return NextResponse.json({
        message: 'Performance metrics cleaned up successfully',
        timestamp: new Date().toISOString()
      })
    }

    throw createError.invalidInput('action', body.action, 'cleanup', req.nextUrl.pathname)
  })(req)
})