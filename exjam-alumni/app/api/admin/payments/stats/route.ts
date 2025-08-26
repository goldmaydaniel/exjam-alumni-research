import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/auth-complete'
import { withErrorHandling } from '@/lib/middleware/error-middleware'
import { db } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/payments/stats
 * Get payment statistics for admin dashboard
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  const session = await requireAuth(['ADMIN', 'ORGANIZER'])

  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const [
      totalRevenue,
      monthlyRevenue,
      pendingPayments,
      successfulPayments
    ] = await Promise.all([
      // Total revenue from successful payments
      db.payment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amount: true }
      }),
      
      // Revenue this month
      db.payment.aggregate({
        where: {
          status: 'SUCCESS',
          createdAt: { gte: startOfMonth }
        },
        _sum: { amount: true }
      }),
      
      // Pending payments count
      db.payment.count({
        where: { status: 'PENDING' }
      }),
      
      // Successful payments count
      db.payment.count({
        where: { status: 'SUCCESS' }
      })
    ])

    return NextResponse.json({
      totalRevenue: Number(totalRevenue._sum.amount || 0),
      thisMonth: Number(monthlyRevenue._sum.amount || 0),
      pending: pendingPayments,
      successful: successfulPayments
    })
  } catch (error) {
    console.error('Failed to fetch payment stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment statistics' },
      { status: 500 }
    )
  }
})
