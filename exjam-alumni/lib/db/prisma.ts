import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? 
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  }).$extends(withAccelerate())

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

export default db

// Helper types for better type safety
export type DbClient = typeof db

// Transaction helper
export async function withTransaction<T>(
  callback: (tx: DbClient) => Promise<T>
): Promise<T> {
  return await db.$transaction(callback)
}

// Connection helper
export async function ensureConnection() {
  try {
    await db.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

// Graceful disconnect
export async function disconnectDb() {
  await db.$disconnect()
}

// Query helpers for common patterns
export const queries = {
  // User queries
  async getUserById(id: string) {
    return db.user.findUnique({
      where: { id },
      include: {
        Registration: {
          include: {
            Event: true,
            Payment: true,
            Ticket: true
          }
        },
        Payment: true,
        Ticket: true
      }
    })
  },

  async getUserByEmail(email: string) {
    return db.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        Registration: {
          include: {
            Event: true,
            Payment: true
          }
        }
      }
    })
  },

  // Event queries
  async getEventWithRegistrations(eventId: string) {
    return db.event.findUnique({
      where: { id: eventId },
      include: {
        Registration: {
          include: {
            User: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profilePhoto: true
              }
            },
            Payment: true
          }
        },
        Waitlist: {
          include: {
            User: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            Registration: true,
            Waitlist: true
          }
        }
      }
    })
  },

  async getUpcomingEvents(limit: number = 10) {
    return db.event.findMany({
      where: {
        status: 'PUBLISHED',
        startDate: {
          gte: new Date()
        }
      },
      orderBy: {
        startDate: 'asc'
      },
      take: limit,
      include: {
        _count: {
          select: {
            Registration: true
          }
        }
      }
    })
  },

  // Registration queries
  async getRegistrationWithDetails(registrationId: string) {
    return db.registration.findUnique({
      where: { id: registrationId },
      include: {
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profilePhoto: true
          }
        },
        Event: true,
        Payment: true,
        Ticket: true
      }
    })
  },

  async getUserRegistrations(userId: string) {
    return db.registration.findMany({
      where: { userId },
      include: {
        Event: true,
        Payment: true,
        Ticket: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  },

  // Alumni queries
  async getAlumniDirectory(filters: {
    search?: string
    graduation?: string
    squadron?: string
    location?: string
    skip?: number
    take?: number
  } = {}) {
    const {
      search,
      graduation,
      squadron,
      location,
      skip = 0,
      take = 20
    } = filters

    const where: any = {
      status: 'ACTIVE',
      role: {
        in: ['VERIFIED_MEMBER', 'ADMIN', 'ORGANIZER']
      }
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { currentOccupation: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (graduation) {
      where.graduationYear = graduation
    }

    if (squadron) {
      where.squadron = squadron
    }

    if (location) {
      where.OR = where.OR || []
      where.OR.push(
        { currentLocation: { contains: location, mode: 'insensitive' } },
        { chapter: { contains: location, mode: 'insensitive' } }
      )
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          fullName: true,
          email: true,
          profilePhoto: true,
          graduationYear: true,
          squadron: true,
          currentLocation: true,
          chapter: true,
          company: true,
          currentOccupation: true,
          bio: true,
          createdAt: true
        },
        skip,
        take,
        orderBy: [
          { graduationYear: 'desc' },
          { lastName: 'asc' }
        ]
      }),
      db.user.count({ where })
    ])

    return {
      users,
      total,
      hasMore: total > skip + take
    }
  }
}

// Bulk operations
export const bulkOps = {
  async updateUserRoles(userIds: string[], role: string) {
    return db.user.updateMany({
      where: {
        id: {
          in: userIds
        }
      },
      data: {
        role: role as any,
        updatedAt: new Date()
      }
    })
  },

  async markRegistrationsAsPaid(registrationIds: string[]) {
    return withTransaction(async (tx) => {
      // Update registrations
      await tx.registration.updateMany({
        where: {
          id: { in: registrationIds }
        },
        data: {
          status: 'CONFIRMED',
          updatedAt: new Date()
        }
      })

      // Update payments
      await tx.payment.updateMany({
        where: {
          registrationId: { in: registrationIds }
        },
        data: {
          status: 'SUCCESS',
          updatedAt: new Date()
        }
      })

      return true
    })
  }
}

// Database health and stats
export const dbStats = {
  async getOverview() {
    const [
      totalUsers,
      activeUsers,
      totalEvents,
      upcomingEvents,
      totalRegistrations,
      confirmedRegistrations
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { status: 'ACTIVE' } }),
      db.event.count(),
      db.event.count({
        where: {
          status: 'PUBLISHED',
          startDate: { gte: new Date() }
        }
      }),
      db.registration.count(),
      db.registration.count({ where: { status: 'CONFIRMED' } })
    ])

    return {
      users: { total: totalUsers, active: activeUsers },
      events: { total: totalEvents, upcoming: upcomingEvents },
      registrations: { total: totalRegistrations, confirmed: confirmedRegistrations }
    }
  },

  async getRecentActivity() {
    const [recentUsers, recentRegistrations, recentEvents] = await Promise.all([
      db.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          createdAt: true
        }
      }),
      db.registration.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
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
      }),
      db.event.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          startDate: true,
          status: true,
          createdAt: true
        }
      })
    ])

    return {
      recentUsers,
      recentRegistrations,
      recentEvents
    }
  }
}