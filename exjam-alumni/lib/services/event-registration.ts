import { db, withTransaction } from '@/lib/db/prisma'
import { EventStatus, RegistrationStatus, TicketType, WaitlistStatus } from '@prisma/client'
import { AuthUser } from '@/lib/auth/unified-auth'
import crypto from 'crypto'

export interface RegistrationData {
  eventId: string
  userId: string
  ticketType: TicketType
  arrivalDate?: Date
  departureDate?: Date
  expectations?: string
  specialRequests?: string
  profilePhoto?: string
}

export interface RegistrationResult {
  success: boolean
  registration?: any
  waitlistPosition?: number
  paymentRequired?: boolean
  message: string
  error?: string
}

export class EventRegistrationService {
  
  /**
   * Check if event has available capacity
   */
  async checkEventCapacity(eventId: string): Promise<{
    hasCapacity: boolean
    currentRegistrations: number
    capacity: number
    waitlistCount: number
  }> {
    const event = await db.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            Registration: {
              where: {
                status: {
                  in: ['PENDING', 'CONFIRMED']
                }
              }
            },
            Waitlist: {
              where: {
                status: 'ACTIVE'
              }
            }
          }
        }
      }
    })

    if (!event) {
      throw new Error('Event not found')
    }

    const currentRegistrations = event._count.Registration
    const waitlistCount = event._count.Waitlist
    const hasCapacity = currentRegistrations < event.capacity

    return {
      hasCapacity,
      currentRegistrations,
      capacity: event.capacity,
      waitlistCount
    }
  }

  /**
   * Check if user is already registered for event
   */
  async checkExistingRegistration(eventId: string, userId: string): Promise<{
    hasRegistration: boolean
    registration?: any
    isOnWaitlist: boolean
    waitlistEntry?: any
  }> {
    const [registration, waitlistEntry] = await Promise.all([
      db.registration.findFirst({
        where: {
          eventId,
          userId,
          status: {
            in: ['PENDING', 'CONFIRMED']
          }
        }
      }),
      db.waitlist.findFirst({
        where: {
          eventId,
          userId,
          status: 'ACTIVE'
        }
      })
    ])

    return {
      hasRegistration: !!registration,
      registration,
      isOnWaitlist: !!waitlistEntry,
      waitlistEntry
    }
  }

  /**
   * Register user for event with automatic waitlist management
   */
  async registerForEvent(data: RegistrationData): Promise<RegistrationResult> {
    return await withTransaction(async (tx) => {
      // Check if event exists and is published
      const event = await tx.event.findUnique({
        where: { id: data.eventId },
        include: {
          _count: {
            select: {
              Registration: {
                where: {
                  status: {
                    in: ['PENDING', 'CONFIRMED']
                  }
                }
              }
            }
          }
        }
      })

      if (!event) {
        return {
          success: false,
          message: 'Event not found',
          error: 'EVENT_NOT_FOUND'
        }
      }

      if (event.status !== 'PUBLISHED') {
        return {
          success: false,
          message: 'Event is not available for registration',
          error: 'EVENT_NOT_PUBLISHED'
        }
      }

      // Check if registration deadline has passed
      if (new Date() > event.startDate) {
        return {
          success: false,
          message: 'Registration deadline has passed',
          error: 'REGISTRATION_CLOSED'
        }
      }

      // Check existing registration
      const existing = await this.checkExistingRegistration(data.eventId, data.userId)
      if (existing.hasRegistration) {
        return {
          success: false,
          message: 'You are already registered for this event',
          error: 'ALREADY_REGISTERED'
        }
      }

      if (existing.isOnWaitlist) {
        return {
          success: false,
          message: 'You are already on the waitlist for this event',
          error: 'ALREADY_ON_WAITLIST'
        }
      }

      // Check capacity
      const currentRegistrations = event._count.Registration
      const hasCapacity = currentRegistrations < event.capacity

      if (!hasCapacity) {
        // Add to waitlist
        const position = await this.addToWaitlist(data.eventId, data.userId, data.ticketType)
        
        return {
          success: true,
          waitlistPosition: position,
          message: `Event is full. You have been added to the waitlist at position ${position}.`,
          paymentRequired: false
        }
      }

      // Create registration
      const registrationId = crypto.randomUUID()
      
      const registration = await tx.registration.create({
        data: {
          id: registrationId,
          userId: data.userId,
          eventId: data.eventId,
          ticketType: data.ticketType,
          status: 'PENDING',
          arrivalDate: data.arrivalDate,
          departureDate: data.departureDate,
          expectations: data.expectations,
          specialRequests: data.specialRequests,
          photoUrl: data.profilePhoto,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          Event: {
            select: {
              id: true,
              title: true,
              startDate: true,
              endDate: true,
              venue: true,
              price: true
            }
          },
          User: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })

      return {
        success: true,
        registration,
        paymentRequired: event.price > 0,
        message: 'Registration successful! Please complete payment to confirm your spot.'
      }
    })
  }

  /**
   * Add user to waitlist
   */
  private async addToWaitlist(eventId: string, userId: string, ticketType: TicketType): Promise<number> {
    // Get current waitlist position
    const waitlistCount = await db.waitlist.count({
      where: {
        eventId,
        status: 'ACTIVE'
      }
    })

    const position = waitlistCount + 1

    await db.waitlist.create({
      data: {
        userId,
        eventId,
        position,
        ticketType,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    return position
  }

  /**
   * Convert waitlist entry to registration when spot becomes available
   */
  async processWaitlist(eventId: string): Promise<void> {
    const capacity = await this.checkEventCapacity(eventId)
    
    if (!capacity.hasCapacity) {
      return // No spots available
    }

    const spotsAvailable = capacity.capacity - capacity.currentRegistrations
    
    // Get next waitlist entries
    const waitlistEntries = await db.waitlist.findMany({
      where: {
        eventId,
        status: 'ACTIVE'
      },
      orderBy: {
        position: 'asc'
      },
      take: spotsAvailable,
      include: {
        User: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        Event: {
          select: {
            title: true,
            startDate: true
          }
        }
      }
    })

    for (const waitlistEntry of waitlistEntries) {
      await withTransaction(async (tx) => {
        // Create registration
        const registrationId = crypto.randomUUID()
        
        await tx.registration.create({
          data: {
            id: registrationId,
            userId: waitlistEntry.userId,
            eventId: waitlistEntry.eventId,
            ticketType: waitlistEntry.ticketType,
            status: 'PENDING',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })

        // Update waitlist entry
        await tx.waitlist.update({
          where: { id: waitlistEntry.id },
          data: {
            status: 'CONVERTED',
            convertedAt: new Date(),
            updatedAt: new Date()
          }
        })

        // Send notification (implement notification service)
        // await notificationService.sendWaitlistConversionNotification(waitlistEntry)
      })
    }
  }

  /**
   * Cancel registration and process waitlist
   */
  async cancelRegistration(registrationId: string, userId: string): Promise<RegistrationResult> {
    return await withTransaction(async (tx) => {
      const registration = await tx.registration.findUnique({
        where: { id: registrationId },
        include: {
          Event: true,
          Payment: true
        }
      })

      if (!registration) {
        return {
          success: false,
          message: 'Registration not found',
          error: 'REGISTRATION_NOT_FOUND'
        }
      }

      if (registration.userId !== userId) {
        return {
          success: false,
          message: 'Unauthorized to cancel this registration',
          error: 'UNAUTHORIZED'
        }
      }

      // Check if event has started
      if (new Date() > registration.Event.startDate) {
        return {
          success: false,
          message: 'Cannot cancel registration for events that have already started',
          error: 'EVENT_STARTED'
        }
      }

      // Update registration status
      await tx.registration.update({
        where: { id: registrationId },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date()
        }
      })

      // Handle refunds if payment was made
      if (registration.Payment && registration.Payment.status === 'SUCCESS') {
        // Mark payment for refund (implement refund logic)
        await tx.payment.update({
          where: { id: registration.Payment.id },
          data: {
            status: 'REFUNDED',
            updatedAt: new Date()
          }
        })
      }

      // Process waitlist asynchronously
      setImmediate(() => {
        this.processWaitlist(registration.eventId).catch(console.error)
      })

      return {
        success: true,
        message: 'Registration cancelled successfully'
      }
    })
  }

  /**
   * Get registration details with related data
   */
  async getRegistration(registrationId: string): Promise<any> {
    return await db.registration.findUnique({
      where: { id: registrationId },
      include: {
        Event: {
          select: {
            id: true,
            title: true,
            description: true,
            startDate: true,
            endDate: true,
            venue: true,
            address: true,
            price: true,
            imageUrl: true
          }
        },
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
        Payment: true,
        Ticket: true
      }
    })
  }

  /**
   * Get user's registrations
   */
  async getUserRegistrations(userId: string): Promise<any[]> {
    return await db.registration.findMany({
      where: { userId },
      include: {
        Event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            venue: true,
            price: true,
            imageUrl: true
          }
        },
        Payment: true,
        Ticket: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  /**
   * Get event statistics
   */
  async getEventStats(eventId: string): Promise<{
    totalCapacity: number
    registeredCount: number
    confirmedCount: number
    pendingCount: number
    waitlistCount: number
    availableSpots: number
    revenue: number
  }> {
    const event = await db.event.findUnique({
      where: { id: eventId },
      include: {
        Registration: {
          include: {
            Payment: true
          }
        },
        _count: {
          select: {
            Waitlist: {
              where: {
                status: 'ACTIVE'
              }
            }
          }
        }
      }
    })

    if (!event) {
      throw new Error('Event not found')
    }

    const registeredCount = event.Registration.length
    const confirmedCount = event.Registration.filter(r => r.status === 'CONFIRMED').length
    const pendingCount = event.Registration.filter(r => r.status === 'PENDING').length
    const waitlistCount = event._count.Waitlist
    const availableSpots = Math.max(0, event.capacity - registeredCount)
    
    const revenue = event.Registration.reduce((total, reg) => {
      if (reg.Payment && reg.Payment.status === 'SUCCESS') {
        return total + Number(reg.Payment.amount)
      }
      return total
    }, 0)

    return {
      totalCapacity: event.capacity,
      registeredCount,
      confirmedCount,
      pendingCount,
      waitlistCount,
      availableSpots,
      revenue
    }
  }
}

export const eventRegistrationService = new EventRegistrationService()