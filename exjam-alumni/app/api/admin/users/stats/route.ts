import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/auth-complete'
import { withErrorHandling } from '@/lib/middleware/error-middleware'
import { db } from '@/lib/db/prisma'

/**
 * GET /api/admin/users/stats
 * Get user statistics for admin dashboard
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  const session = await requireAuth(['ADMIN', 'ORGANIZER'])
  
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const [
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      usersByRole
    ] = await Promise.all([
      // Total users
      db.user.count(),
      
      // Active users
      db.user.count({
        where: { status: 'ACTIVE' }
      }),
      
      // New users this month
      db.user.count({
        where: {
          createdAt: { gte: startOfMonth },
          status: 'ACTIVE'
        }
      }),
      
      // Users by role
      db.user.groupBy({
        by: ['role'],
        _count: true,
        where: { status: 'ACTIVE' }
      })
    ])

    const roleData = usersByRole.map(group => ({
      role: group.role,
      count: group._count
    }))

    return NextResponse.json({
      total: totalUsers,
      active: activeUsers,
      newThisMonth: newUsersThisMonth,
      byRole: roleData
    })
  } catch (error) {
    console.error('Failed to fetch user stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user statistics' },
      { status: 500 }
    )
  }
})