import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/auth-complete'
import { withErrorHandling } from '@/lib/middleware/error-middleware'
import { db } from '@/lib/db/prisma'

/**
 * GET /api/admin/events/stats
 * Get event statistics for admin dashboard
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  const session = await requireAuth(['ADMIN', 'ORGANIZER'])

  try {
    const now = new Date()
    
    const [
      totalEvents,
      publishedEvents,
      upcomingEvents,
      totalRegistrations
    ] = await Promise.all([
      // Total events
      db.event.count(),
      
      // Published events
      db.event.count({
        where: { status: 'PUBLISHED' }
      }),
      
      // Upcoming events (published and in future)
      db.event.count({
        where: {
          status: 'PUBLISHED',
          startDate: { gte: now }
        }
      }),
      
      // Total registrations
      db.registration.count()
    ])

    return NextResponse.json({
      total: totalEvents,
      published: publishedEvents,
      upcoming: upcomingEvents,
      registrations: totalRegistrations
    })
  } catch (error) {
    console.error('Failed to fetch event stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event statistics' },
      { status: 500 }
    )
  }
})