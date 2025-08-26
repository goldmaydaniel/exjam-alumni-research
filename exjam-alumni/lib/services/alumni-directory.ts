import { db, queries } from '@/lib/db/prisma'
import { withCache, cacheKeys, cacheDurations, cacheInvalidation } from '@/lib/cache/redis-cache'
import { UserRole, Squadron } from '@prisma/client'

export interface AlumniSearchFilters {
  search?: string
  graduation?: string
  squadron?: Squadron
  location?: string
  industry?: string
  mentoring?: boolean
  seeking?: boolean
  page?: number
  limit?: number
}

export interface AlumniProfile {
  id: string
  firstName: string
  lastName: string
  fullName?: string
  email: string
  profilePhoto?: string
  graduationYear?: string
  squadron?: Squadron
  currentLocation?: string
  chapter?: string
  company?: string
  currentOccupation?: string
  bio?: string
  skills: string[]
  interests: string[]
  isAvailableForMentoring: boolean
  isSeekingMentorship: boolean
  linkedinProfile?: string
  websiteUrl?: string
  createdAt: Date
  connections?: number
  mutualConnections?: number
}

export interface AlumniSearchResult {
  profiles: AlumniProfile[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    hasMore: boolean
  }
  facets: {
    graduationYears: { year: string; count: number }[]
    squadrons: { squadron: Squadron; count: number }[]
    locations: { location: string; count: number }[]
    industries: { industry: string; count: number }[]
  }
}

export class AlumniDirectoryService {
  
  /**
   * Search alumni with caching and performance optimization
   */
  async searchAlumni(
    filters: AlumniSearchFilters,
    currentUserId?: string
  ): Promise<AlumniSearchResult> {
    const cacheKey = cacheKeys.alumniDirectory({
      ...filters,
      currentUserId: currentUserId || 'anonymous'
    })

    return withCache(
      cacheKey,
      cacheDurations.alumniDirectory,
      () => this._searchAlumniFromDatabase(filters, currentUserId)
    )
  }

  /**
   * Get alumni profile with caching
   */
  async getAlumniProfile(
    userId: string,
    viewerId?: string
  ): Promise<AlumniProfile | null> {
    const cacheKey = cacheKeys.alumniProfile(`${userId}:${viewerId || 'anonymous'}`)
    
    return withCache(
      cacheKey,
      cacheDurations.userProfile,
      () => this._getAlumniProfileFromDatabase(userId, viewerId)
    )
  }

  /**
   * Update alumni profile and invalidate cache
   */
  async updateAlumniProfile(
    userId: string,
    updates: Partial<AlumniProfile>
  ): Promise<AlumniProfile> {
    // Update in database
    const updatedProfile = await db.user.update({
      where: { id: userId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            // Would need alumni connections table
            // Connections: true
          }
        }
      }
    })

    // Invalidate related caches
    await Promise.all([
      cacheInvalidation.invalidateUser(userId),
      cacheInvalidation.invalidateAlumniDirectory(),
    ])

    return this._formatAlumniProfile(updatedProfile)
  }

  /**
   * Get alumni suggestions based on graduation year, squadron, location
   */
  async getAlumniSuggestions(
    userId: string,
    limit: number = 10
  ): Promise<AlumniProfile[]> {
    const cacheKey = `alumni:suggestions:${userId}:${limit}`
    
    return withCache(
      cacheKey,
      cacheDurations.alumniDirectory,
      async () => {
        // Get current user's details
        const currentUser = await db.user.findUnique({
          where: { id: userId },
          select: {
            graduationYear: true,
            squadron: true,
            currentLocation: true,
            chapter: true,
          }
        })

        if (!currentUser) {
          return []
        }

        // Find similar alumni
        const suggestions = await db.user.findMany({
          where: {
            AND: [
              { id: { not: userId } },
              { status: 'ACTIVE' },
              { role: { in: ['VERIFIED_MEMBER', 'ADMIN', 'ORGANIZER'] } },
              {
                OR: [
                  { graduationYear: currentUser.graduationYear },
                  { squadron: currentUser.squadron },
                  { currentLocation: { contains: currentUser.currentLocation || '', mode: 'insensitive' } },
                  { chapter: currentUser.chapter },
                ]
              }
            ]
          },
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
            bio: true,
          },
          take: limit,
          orderBy: [
            { graduationYear: 'desc' },
            { createdAt: 'desc' },
          ]
        })

        return suggestions.map(this._formatAlumniProfile)
      }
    )
  }

  /**
   * Get alumni statistics
   */
  async getAlumniStats(): Promise<{
    total: number
    byGraduation: { year: string; count: number }[]
    bySquadron: { squadron: Squadron; count: number }[]
    byLocation: { location: string; count: number }[]
    mentors: number
    seekingMentorship: number
  }> {
    const cacheKey = 'alumni:stats'
    
    return withCache(
      cacheKey,
      cacheDurations.dashboardStats,
      async () => {
        const [
          total,
          byGraduation,
          bySquadron,
          byLocation,
          mentorCount,
          seekingCount,
        ] = await Promise.all([
          // Total alumni
          db.user.count({
            where: {
              status: 'ACTIVE',
              role: { in: ['VERIFIED_MEMBER', 'ADMIN', 'ORGANIZER'] }
            }
          }),
          
          // By graduation year
          db.user.groupBy({
            by: ['graduationYear'],
            where: {
              status: 'ACTIVE',
              role: { in: ['VERIFIED_MEMBER', 'ADMIN', 'ORGANIZER'] },
              graduationYear: { not: null }
            },
            _count: true,
            orderBy: { graduationYear: 'desc' }
          }),
          
          // By squadron
          db.user.groupBy({
            by: ['squadron'],
            where: {
              status: 'ACTIVE',
              role: { in: ['VERIFIED_MEMBER', 'ADMIN', 'ORGANIZER'] },
              squadron: { not: null }
            },
            _count: true,
            orderBy: { _count: { squadron: 'desc' } }
          }),
          
          // By location (top 10)
          db.user.groupBy({
            by: ['currentLocation'],
            where: {
              status: 'ACTIVE',
              role: { in: ['VERIFIED_MEMBER', 'ADMIN', 'ORGANIZER'] },
              currentLocation: { not: null }
            },
            _count: true,
            orderBy: { _count: { currentLocation: 'desc' } },
            take: 10
          }),
          
          // Available mentors - would need alumni_profiles table
          db.user.count({
            where: {
              status: 'ACTIVE',
              role: { in: ['VERIFIED_MEMBER', 'ADMIN', 'ORGANIZER'] },
              // isAvailableForMentoring: true
            }
          }),
          
          // Seeking mentorship - would need alumni_profiles table  
          db.user.count({
            where: {
              status: 'ACTIVE',
              role: { in: ['VERIFIED_MEMBER', 'ADMIN', 'ORGANIZER'] },
              // isSeekingMentorship: true
            }
          }),
        ])

        return {
          total,
          byGraduation: byGraduation.map(g => ({
            year: g.graduationYear || 'Unknown',
            count: g._count
          })),
          bySquadron: bySquadron.map(s => ({
            squadron: s.squadron!,
            count: s._count
          })),
          byLocation: byLocation.map(l => ({
            location: l.currentLocation || 'Unknown',
            count: l._count
          })),
          mentors: 0, // Would need to implement with proper alumni_profiles table
          seekingMentorship: 0,
        }
      }
    )
  }

  /**
   * Private method to search database
   */
  private async _searchAlumniFromDatabase(
    filters: AlumniSearchFilters,
    currentUserId?: string
  ): Promise<AlumniSearchResult> {
    const {
      search,
      graduation,
      squadron,
      location,
      industry,
      mentoring,
      seeking,
      page = 1,
      limit = 20
    } = filters

    const skip = (page - 1) * limit
    const take = Math.min(limit, 50) // Max 50 per page

    // Build search conditions
    const where: any = {
      status: 'ACTIVE',
      role: { in: ['VERIFIED_MEMBER', 'ADMIN', 'ORGANIZER'] }
    }

    if (currentUserId) {
      where.id = { not: currentUserId } // Exclude current user
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { currentOccupation: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
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

    // Execute search with facets in parallel
    const [users, total, graduationFacets, squadronFacets, locationFacets] = await Promise.all([
      // Main search results
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
          createdAt: true,
        },
        skip,
        take,
        orderBy: [
          { graduationYear: 'desc' },
          { lastName: 'asc' }
        ]
      }),
      
      // Total count
      db.user.count({ where }),
      
      // Graduation year facets
      db.user.groupBy({
        by: ['graduationYear'],
        where: {
          ...where,
          graduationYear: { not: null }
        },
        _count: true,
        orderBy: { graduationYear: 'desc' }
      }),
      
      // Squadron facets
      db.user.groupBy({
        by: ['squadron'],
        where: {
          ...where,
          squadron: { not: null }
        },
        _count: true,
        orderBy: { _count: { squadron: 'desc' } }
      }),
      
      // Location facets (top 10)
      db.user.groupBy({
        by: ['currentLocation'],
        where: {
          ...where,
          currentLocation: { not: null }
        },
        _count: true,
        orderBy: { _count: { currentLocation: 'desc' } },
        take: 10
      }),
    ])

    return {
      profiles: users.map(this._formatAlumniProfile),
      pagination: {
        page,
        limit: take,
        total,
        pages: Math.ceil(total / take),
        hasMore: total > skip + take
      },
      facets: {
        graduationYears: graduationFacets.map(f => ({
          year: f.graduationYear || 'Unknown',
          count: f._count
        })),
        squadrons: squadronFacets.map(f => ({
          squadron: f.squadron!,
          count: f._count
        })),
        locations: locationFacets.map(f => ({
          location: f.currentLocation || 'Unknown',
          count: f._count
        })),
        industries: [] // Would need to implement with proper company categorization
      }
    }
  }

  /**
   * Private method to get profile from database
   */
  private async _getAlumniProfileFromDatabase(
    userId: string,
    viewerId?: string
  ): Promise<AlumniProfile | null> {
    const user = await db.user.findUnique({
      where: {
        id: userId,
        status: 'ACTIVE'
      },
      include: {
        _count: {
          select: {
            // Would need connections table
            // Connections: true
          }
        }
      }
    })

    if (!user) {
      return null
    }

    return this._formatAlumniProfile(user)
  }

  /**
   * Format user data to alumni profile
   */
  private _formatAlumniProfile(user: any): AlumniProfile {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      email: user.email,
      profilePhoto: user.profilePhoto,
      graduationYear: user.graduationYear,
      squadron: user.squadron,
      currentLocation: user.currentLocation,
      chapter: user.chapter,
      company: user.company,
      currentOccupation: user.currentOccupation,
      bio: user.bio,
      skills: [], // Would implement with skills table
      interests: [], // Would implement with interests table
      isAvailableForMentoring: false, // Would implement with alumni_profiles table
      isSeekingMentorship: false,
      linkedinProfile: undefined,
      websiteUrl: undefined,
      createdAt: user.createdAt,
      connections: 0, // Would implement with connections count
      mutualConnections: 0,
    }
  }
}

export const alumniDirectoryService = new AlumniDirectoryService()