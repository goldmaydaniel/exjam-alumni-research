import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/auth-complete'
import { withErrorHandling } from '@/lib/middleware/error-middleware'
import { db } from '@/lib/db/prisma'

/**
 * GET /api/admin/events
 * Get events for admin management
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  const session = await requireAuth(['ADMIN', 'ORGANIZER'])

  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {}

    // For organizers, only show their events (admins see all)
    if (session.user.role === 'ORGANIZER') {
      where.organizerId = session.user.id
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { venue: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status && status !== 'ALL') {
      where.status = status
    }

    const [events, total] = await Promise.all([
      db.event.findMany({
        where,
        include: {
          _count: {
            select: {
              Registration: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      db.event.count({ where })
    ])

    const eventsWithCounts = events.map(event => ({
      id: event.id,
      title: event.title,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      status: event.status,
      venue: event.venue,
      capacity: event.capacity,
      price: Number(event.price),
      registrationCount: event._count.Registration,
      organizerId: event.organizerId
    }))

    return NextResponse.json({
      events: eventsWithCounts,
      total,
      limit,
      offset,
      hasMore: total > offset + limit
    })
  } catch (error) {
    console.error('Failed to fetch admin events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
})