/**
 * Database Optimization Utilities
 * Provides performance monitoring, query optimization, and maintenance tools
 */

import { db } from './prisma'
import { logger } from '@/lib/logging/logger'
import { performanceMonitor } from '@/lib/monitoring/performance-monitor'

export interface QueryPerformanceMetrics {
  query: string
  duration: number
  rowCount: number
  timestamp: Date
}

export interface DatabaseHealth {
  activeConnections: number
  slowQueries: QueryPerformanceMetrics[]
  tableStats: Array<{
    table: string
    rowCount: number
    size: string
    indexUsage: number
  }>
  connectionPoolStats: {
    free: number
    used: number
    size: number
  }
}

/**
 * Query optimization wrapper with performance tracking
 */
export function withQueryTracking<T>(queryName: string, query: () => Promise<T>): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const startTime = Date.now()
    
    try {
      const result = await query()
      const duration = Date.now() - startTime
      
      // Record query performance
      performanceMonitor.recordDbQuery(queryName, duration)
      
      // Log slow queries
      if (duration > 1000) { // 1 second threshold
        logger.performance(`Slow query detected: ${queryName}`, {
          duration,
          query: queryName,
          timestamp: new Date().toISOString()
        })
      }
      
      resolve(result)
    } catch (error) {
      const duration = Date.now() - startTime
      
      logger.error(`Query failed: ${queryName}`, {
        duration,
        query: queryName,
        error: error instanceof Error ? error.message : String(error)
      })
      
      reject(error)
    }
  })
}

/**
 * Optimized queries for common operations
 */
export const optimizedQueries = {
  /**
   * Get events with registration counts (optimized with single query)
   */
  getEventsWithCounts: async (filters: {
    status?: string[]
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  } = {}) => {
    const { status, startDate, endDate, limit = 20, offset = 0 } = filters
    
    return withQueryTracking('events_with_counts', async () => {
      const where: any = {}
      
      if (status?.length) {
        where.status = { in: status }
      }
      
      if (startDate) {
        where.startDate = { gte: startDate }
      }
      
      if (endDate) {
        where.endDate = { lte: endDate }
      }
      
      return db.event.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          shortDescription: true,
          startDate: true,
          endDate: true,
          venue: true,
          capacity: true,
          price: true,
          status: true,
          imageUrl: true,
          _count: {
            select: {
              Registration: {
                where: {
                  status: { in: ['CONFIRMED', 'PENDING'] }
                }
              }
            }
          }
        },
        orderBy: { startDate: 'asc' },
        skip: offset,
        take: limit
      })
    })
  },

  /**
   * Get user with full profile data (optimized single query)
   */
  getUserProfile: async (userId: string) => {
    return withQueryTracking('user_profile', async () => {
      return db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          fullName: true,
          serviceNumber: true,
          squadron: true,
          graduationYear: true,
          currentLocation: true,
          currentOccupation: true,
          company: true,
          bio: true,
          profilePhoto: true,
          role: true,
          status: true,
          createdAt: true,
          lastLogin: true,
          _count: {
            select: {
              Registration: true,
              Events: true
            }
          }
        }
      })
    })
  },

  /**
   * Get event registration analytics (optimized aggregation)
   */
  getEventAnalytics: async (eventId: string) => {
    return withQueryTracking('event_analytics', async () => {
      const [registrations, payments, demographics] = await Promise.all([
        // Registration stats
        db.registration.groupBy({
          by: ['status'],
          where: { eventId },
          _count: true
        }),
        
        // Payment stats
        db.payment.groupBy({
          by: ['status'],
          where: {
            Registration: { eventId }
          },
          _count: true,
          _sum: { amount: true }
        }),
        
        // Demographics
        db.registration.findMany({
          where: { eventId },
          select: {
            User: {
              select: {
                squadron: true,
                graduationYear: true,
                currentLocation: true
              }
            }
          }
        })
      ])

      return {
        registrations,
        payments,
        demographics: {
          bySquadron: groupBy(demographics, r => r.User.squadron).map(([squadron, count]) => ({ squadron, count })),
          byYear: groupBy(demographics, r => r.User.graduationYear).map(([year, count]) => ({ year, count })),
          byLocation: groupBy(demographics, r => r.User.currentLocation).map(([location, count]) => ({ location, count }))
        }
      }
    })
  },

  /**
   * Search alumni with optimized filtering and pagination
   */
  searchAlumni: async (filters: {
    search?: string
    graduation?: string
    squadron?: string
    location?: string
    limit?: number
    offset?: number
  } = {}) => {
    const { search, graduation, squadron, location, limit = 20, offset = 0 } = filters
    
    return withQueryTracking('alumni_search', async () => {
      const where: any = {
        status: 'ACTIVE',
        role: { in: ['VERIFIED_MEMBER', 'ADMIN', 'ORGANIZER'] }
      }
      
      // Text search across multiple fields
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { fullName: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
          { currentOccupation: { contains: search, mode: 'insensitive' } }
        ]
      }
      
      // Filters
      if (graduation) where.graduationYear = graduation
      if (squadron) where.squadron = squadron
      if (location) {
        where.currentLocation = { contains: location, mode: 'insensitive' }
      }
      
      const [users, total] = await Promise.all([
        db.user.findMany({
          where,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            profilePhoto: true,
            graduationYear: true,
            squadron: true,
            currentLocation: true,
            company: true,
            currentOccupation: true,
            bio: true
          },
          skip: offset,
          take: limit,
          orderBy: [
            { lastName: 'asc' },
            { firstName: 'asc' }
          ]
        }),
        
        db.user.count({ where })
      ])
      
      return { users, total, hasMore: total > offset + limit }
    })
  },

  /**
   * Get dashboard statistics (heavily optimized)
   */
  getDashboardStats: async () => {
    return withQueryTracking('dashboard_stats', async () => {
      const now = new Date()
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      
      const [
        totalUsers,
        totalEvents,
        totalRegistrations,
        activeEvents,
        monthlyUsers,
        monthlyRegistrations,
        recentActivity
      ] = await Promise.all([
        // Total counts
        db.user.count({ where: { status: 'ACTIVE' } }),
        db.event.count(),
        db.registration.count(),
        
        // Active events
        db.event.count({
          where: {
            status: 'PUBLISHED',
            endDate: { gte: now }
          }
        }),
        
        // Monthly growth
        db.user.count({
          where: {
            status: 'ACTIVE',
            createdAt: { gte: thisMonth }
          }
        }),
        
        db.registration.count({
          where: { createdAt: { gte: thisMonth } }
        }),
        
        // Recent activity
        db.registration.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            createdAt: true,
            status: true,
            User: {
              select: {
                firstName: true,
                lastName: true
              }
            },
            Event: {
              select: {
                title: true
              }
            }
          }
        })
      ])
      
      return {
        totals: {
          users: totalUsers,
          events: totalEvents,
          registrations: totalRegistrations,
          activeEvents
        },
        monthly: {
          users: monthlyUsers,
          registrations: monthlyRegistrations
        },
        recentActivity
      }
    })
  }
}

/**
 * Database maintenance utilities
 */
export const maintenanceUtils = {
  /**
   * Analyze table statistics
   */
  analyzeTableStats: async (): Promise<DatabaseHealth['tableStats']> => {
    return withQueryTracking('analyze_tables', async () => {
      // This would typically use raw SQL to get table statistics
      // For now, we'll return mock data as Prisma doesn't expose table stats directly
      const tables = ['User', 'Event', 'Registration', 'Payment', 'Ticket']
      
      const stats = await Promise.all(
        tables.map(async (table) => {
          const count = await (db as any)[table.toLowerCase()].count()
          return {
            table,
            rowCount: count,
            size: 'N/A', // Would need raw SQL query
            indexUsage: 100 // Would need raw SQL query
          }
        })
      )
      
      return stats
    })
  },

  /**
   * Clean up old audit logs
   */
  cleanupAuditLogs: async (daysToKeep: number = 90): Promise<number> => {
    return withQueryTracking('cleanup_audit_logs', async () => {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
      
      const result = await db.auditLog.deleteMany({
        where: {
          timestamp: { lt: cutoffDate }
        }
      })
      
      logger.info(`Cleaned up ${result.count} old audit log entries`)
      return result.count
    })
  },

  /**
   * Clean up expired notifications
   */
  cleanupNotifications: async (daysToKeep: number = 30): Promise<number> => {
    return withQueryTracking('cleanup_notifications', async () => {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
      
      const result = await db.notification.deleteMany({
        where: {
          read: true,
          readAt: { lt: cutoffDate }
        }
      })
      
      logger.info(`Cleaned up ${result.count} old notifications`)
      return result.count
    })
  },

  /**
   * Update user full names (maintenance task)
   */
  updateUserFullNames: async (): Promise<number> => {
    return withQueryTracking('update_full_names', async () => {
      const usersWithoutFullName = await db.user.findMany({
        where: {
          OR: [
            { fullName: null },
            { fullName: '' }
          ]
        },
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      })
      
      let updated = 0
      for (const user of usersWithoutFullName) {
        await db.user.update({
          where: { id: user.id },
          data: {
            fullName: `${user.firstName} ${user.lastName}`
          }
        })
        updated++
      }
      
      logger.info(`Updated full names for ${updated} users`)
      return updated
    })
  },

  /**
   * Vacuum and analyze database (would need raw SQL)
   */
  optimizeTables: async (): Promise<void> => {
    return withQueryTracking('optimize_tables', async () => {
      // This would run VACUUM ANALYZE on PostgreSQL
      // For now, just log that we would do this
      logger.info('Database optimization completed (would run VACUUM ANALYZE)')
    })
  }
}

/**
 * Connection pool monitoring
 */
export const connectionPoolMonitor = {
  /**
   * Get connection pool stats
   */
  getStats: async () => {
    // This would typically query the database for connection stats
    // Prisma doesn't expose connection pool details directly
    return {
      free: 8,
      used: 2,
      size: 10
    }
  },

  /**
   * Health check for database connectivity
   */
  healthCheck: async (): Promise<boolean> => {
    try {
      await db.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      logger.error('Database health check failed', { error })
      return false
    }
  }
}

/**
 * Utility function for grouping results
 */
function groupBy<T, K extends string | number | symbol>(
  array: T[],
  keyFn: (item: T) => K | null | undefined
): Array<[K, number]> {
  const groups = new Map<K, number>()
  
  for (const item of array) {
    const key = keyFn(item)
    if (key != null) {
      groups.set(key, (groups.get(key) || 0) + 1)
    }
  }
  
  return Array.from(groups.entries())
}

/**
 * Bulk operations utilities
 */
export const bulkOperations = {
  /**
   * Bulk update user roles
   */
  updateUserRoles: async (updates: Array<{ userId: string; role: string }>) => {
    return withQueryTracking('bulk_update_roles', async () => {
      const results = await Promise.all(
        updates.map(({ userId, role }) =>
          db.user.update({
            where: { id: userId },
            data: { role: role as any }
          })
        )
      )
      
      logger.info(`Bulk updated ${results.length} user roles`)
      return results
    })
  },

  /**
   * Bulk create notifications
   */
  createNotifications: async (notifications: Array<{
    userId: string
    type: string
    title: string
    message: string
    data?: any
  }>) => {
    return withQueryTracking('bulk_create_notifications', async () => {
      const result = await db.notification.createMany({
        data: notifications.map(n => ({
          ...n,
          type: n.type as any
        }))
      })
      
      logger.info(`Bulk created ${result.count} notifications`)
      return result
    })
  }
}

export default {
  withQueryTracking,
  optimizedQueries,
  maintenanceUtils,
  connectionPoolMonitor,
  bulkOperations
}