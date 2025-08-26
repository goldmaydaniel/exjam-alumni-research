import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/auth-middleware'
import { withErrorHandling } from '@/lib/middleware/error-middleware'
import { maintenanceUtils, connectionPoolMonitor, optimizedQueries } from '@/lib/db/optimizations'
import { createError } from '@/lib/errors/api-errors'
import { z } from 'zod'

const databaseQuerySchema = z.object({
  action: z.enum(['stats', 'health', 'cleanup', 'optimize', 'analytics']),
  table: z.string().optional(),
  days: z.coerce.number().min(1).max(365).default(30)
})

/**
 * GET /api/admin/database
 * Get database statistics and health information
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  return withAuth(['ADMIN'], async (user) => {
    const { searchParams } = new URL(req.url)
    const query = databaseQuerySchema.parse({
      action: searchParams.get('action') || 'stats',
      table: searchParams.get('table'),
      days: searchParams.get('days')
    })

    switch (query.action) {
      case 'stats':
        const [tableStats, poolStats, dashboardStats] = await Promise.all([
          maintenanceUtils.analyzeTableStats(),
          connectionPoolMonitor.getStats(),
          optimizedQueries.getDashboardStats()
        ])

        return NextResponse.json({
          tableStats,
          connectionPool: poolStats,
          dashboardStats,
          timestamp: new Date().toISOString()
        })

      case 'health':
        const isHealthy = await connectionPoolMonitor.healthCheck()
        
        return NextResponse.json({
          healthy: isHealthy,
          connectionPool: await connectionPoolMonitor.getStats(),
          timestamp: new Date().toISOString()
        })

      case 'analytics':
        const analytics = await optimizedQueries.getDashboardStats()
        
        return NextResponse.json({
          analytics,
          timestamp: new Date().toISOString()
        })

      default:
        throw createError.invalidInput('action', query.action, 'stats|health|analytics', req.nextUrl.pathname)
    }
  })(req)
})

/**
 * POST /api/admin/database
 * Perform database maintenance operations
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  return withAuth(['ADMIN'], async (user) => {
    const body = await req.json()
    const { action, days = 30 } = body

    let result: any = {}

    switch (action) {
      case 'cleanup_audit_logs':
        const auditLogsDeleted = await maintenanceUtils.cleanupAuditLogs(days)
        result = {
          action: 'cleanup_audit_logs',
          deleted: auditLogsDeleted,
          days
        }
        break

      case 'cleanup_notifications':
        const notificationsDeleted = await maintenanceUtils.cleanupNotifications(days)
        result = {
          action: 'cleanup_notifications', 
          deleted: notificationsDeleted,
          days
        }
        break

      case 'update_full_names':
        const usersUpdated = await maintenanceUtils.updateUserFullNames()
        result = {
          action: 'update_full_names',
          updated: usersUpdated
        }
        break

      case 'optimize_tables':
        await maintenanceUtils.optimizeTables()
        result = {
          action: 'optimize_tables',
          message: 'Database optimization completed'
        }
        break

      case 'full_maintenance':
        // Run all maintenance tasks
        const [auditCleanup, notificationCleanup, nameUpdates] = await Promise.all([
          maintenanceUtils.cleanupAuditLogs(days),
          maintenanceUtils.cleanupNotifications(days),
          maintenanceUtils.updateUserFullNames()
        ])
        
        await maintenanceUtils.optimizeTables()
        
        result = {
          action: 'full_maintenance',
          results: {
            auditLogsDeleted: auditCleanup,
            notificationsDeleted: notificationCleanup,
            usersUpdated: nameUpdates,
            tablesOptimized: true
          }
        }
        break

      default:
        throw createError.invalidInput('action', action, 'cleanup_audit_logs|cleanup_notifications|update_full_names|optimize_tables|full_maintenance', req.nextUrl.pathname)
    }

    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
      performedBy: user.id
    })
  })(req)
})