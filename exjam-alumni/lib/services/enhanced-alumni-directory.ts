import { createClient } from '@/lib/supabase/server'
import { createClient as createClientSide } from '@/lib/supabase/client'
import { cache } from 'react'
import { unstable_cache } from 'next/cache'

export interface EnhancedAlumniProfile {
  id: string
  user_id: string
  
  // Personal Information
  first_name: string
  last_name: string
  full_name?: string
  email: string
  profile_photo?: string
  
  // Alumni Specific
  graduation_year?: number
  squadron?: 'BLUE' | 'GREEN' | 'PURPLE' | 'YELLOW' | 'RED'
  svc_number?: string
  
  // Professional Information
  current_company?: string
  job_title?: string
  industry?: string
  work_experience?: number
  
  // Location Information
  location_city?: string
  location_country?: string
  location_coordinates?: { lat: number; lng: number }
  timezone?: string
  
  // Profile Details
  bio?: string
  skills: string[]
  interests: string[]
  languages: string[]
  achievements: string[]
  
  // Social & Networking
  linkedin_profile?: string
  website_url?: string
  github_profile?: string
  twitter_handle?: string
  
  // Mentorship & Networking
  is_available_for_mentoring: boolean
  is_seeking_mentorship: boolean
  is_available_for_networking: boolean
  mentorship_areas: string[]
  
  // Privacy & Visibility
  is_public: boolean
  show_email: boolean
  show_phone: boolean
  show_location: boolean
  
  // Engagement
  last_active?: Date
  connection_count: number
  total_connections?: number
  mutual_connections?: number
  profile_views: number
  
  // Metadata
  created_at: Date
  updated_at: Date
  verified_at?: Date
  is_verified: boolean
}

export interface AlumniSearchFilters {
  // Text Search
  search?: string
  
  // Alumni Filters
  graduation_year?: number
  graduation_years?: number[]
  squadron?: string
  squadrons?: string[]
  
  // Professional Filters
  industry?: string
  industries?: string[]
  company?: string
  job_levels?: string[]
  experience_range?: { min: number; max: number }
  
  // Location Filters
  location?: string
  country?: string
  city?: string
  timezone?: string
  coordinates?: { lat: number; lng: number; radius: number }
  
  // Skills & Interests
  skills?: string[]
  interests?: string[]
  languages?: string[]
  
  // Networking
  available_for_mentoring?: boolean
  seeking_mentorship?: boolean
  mentorship_areas?: string[]
  
  // Activity & Engagement
  active_within_days?: number
  min_connections?: number
  verified_only?: boolean
  
  // Sorting & Pagination
  sort_by?: 'relevance' | 'name' | 'graduation_year' | 'last_active' | 'connections'
  sort_order?: 'asc' | 'desc'
  page?: number
  limit?: number
  
  // Advanced
  exclude_user_ids?: string[]
  include_self?: boolean
}

export interface AlumniSearchResult {
  profiles: EnhancedAlumniProfile[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
    has_next: boolean
    has_previous: boolean
  }
  facets: {
    graduation_years: Array<{ year: number; count: number }>
    squadrons: Array<{ squadron: string; count: number }>
    industries: Array<{ industry: string; count: number }>
    locations: Array<{ location: string; count: number }>
    skills: Array<{ skill: string; count: number }>
    mentorship_areas: Array<{ area: string; count: number }>
  }
  search_metadata: {
    query: string
    total_results: number
    search_time_ms: number
    suggestions: string[]
  }
}

export class EnhancedAlumniDirectoryService {
  private supabase = createClient()
  
  /**
   * Search alumni with advanced filtering, faceting, and caching
   */
  searchAlumni = cache(async (
    filters: AlumniSearchFilters,
    viewer_id?: string
  ): Promise<AlumniSearchResult> => {
    const start_time = Date.now()
    
    // Build the query
    let query = this.supabase
      .from('alumni_profiles')
      .select(`
        *,
        users!inner(
          id,
          firstName,
          lastName,
          email,
          profilePhoto,
          lastActiveAt
        )
      `)
      .eq('is_public', true)
      .order('updated_at', { ascending: false })
    
    // Apply filters
    query = this.applyFilters(query, filters, viewer_id)
    
    // Execute search with pagination
    const page = filters.page || 1
    const limit = Math.min(filters.limit || 20, 100)
    const offset = (page - 1) * limit
    
    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
    
    if (error) {
      throw new Error(`Search failed: ${error.message}`)
    }
    
    // Get facets in parallel
    const facets = await this.getFacets(filters, viewer_id)
    
    const search_time_ms = Date.now() - start_time
    
    return {
      profiles: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
        has_next: (count || 0) > offset + limit,
        has_previous: page > 1,
      },
      facets,
      search_metadata: {
        query: filters.search || '',
        total_results: count || 0,
        search_time_ms,
        suggestions: await this.getSearchSuggestions(filters.search || ''),
      },
    }
  })
  
  /**
   * Get a single alumni profile with viewer context
   */
  getAlumniProfile = cache(async (
    user_id: string,
    viewer_id?: string
  ): Promise<EnhancedAlumniProfile | null> => {
    const { data, error } = await this.supabase
      .from('alumni_profiles')
      .select(`
        *,
        users!inner(
          id,
          firstName,
          lastName,
          email,
          profilePhoto,
          lastActiveAt
        )
      `)
      .eq('user_id', user_id)
      .single()
    
    if (error || !data) {
      return null
    }
    
    // Get connection count and mutual connections
    const [connectionCount, mutualConnections] = await Promise.all([
      this.getConnectionCount(user_id),
      viewer_id ? this.getMutualConnectionCount(user_id, viewer_id) : 0,
    ])
    
    return {
      ...data,
      connection_count: connectionCount,
      mutual_connections: mutualConnections,
    }
  })
  
  /**
   * Get alumni suggestions for a user
   */
  getAlumniSuggestions = cache(async (
    user_id: string,
    limit: number = 10
  ): Promise<EnhancedAlumniProfile[]> => {
    const user_profile = await this.getAlumniProfile(user_id)
    if (!user_profile) return []
    
    let query = this.supabase
      .from('alumni_profiles')
      .select(`
        *,
        users!inner(
          id,
          firstName,
          lastName,
          profilePhoto
        )
      `)
      .eq('is_public', true)
      .neq('user_id', user_id)
      .limit(limit)
    
    // Prioritize same graduation year or squadron
    if (user_profile.graduation_year) {
      query = query.eq('graduation_year', user_profile.graduation_year)
    } else if (user_profile.squadron) {
      query = query.eq('squadron', user_profile.squadron)
    }
    
    const { data } = await query
    return data || []
  })
  
  /**
   * Update alumni profile
   */
  async updateAlumniProfile(
    user_id: string,
    updates: Partial<EnhancedAlumniProfile>
  ): Promise<EnhancedAlumniProfile> {
    const { data, error } = await this.supabase
      .from('alumni_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user_id)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Profile update failed: ${error.message}`)
    }
    
    // Invalidate cache
    this.invalidateUserCache(user_id)
    
    return data
  }
  
  /**
   * Create alumni profile
   */
  async createAlumniProfile(
    user_id: string,
    profile_data: Partial<EnhancedAlumniProfile>
  ): Promise<EnhancedAlumniProfile> {
    const { data, error } = await this.supabase
      .from('alumni_profiles')
      .insert({
        user_id,
        ...profile_data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()
    
    if (error) {
      throw new Error(`Profile creation failed: ${error.message}`)
    }
    
    return data
  }
  
  /**
   * Get alumni statistics
   */
  getAlumniStats = unstable_cache(
    async () => {
      const [
        total_alumni,
        active_alumni,
        graduation_years,
        squadrons,
        industries,
        locations,
        mentors,
        seeking_mentorship,
      ] = await Promise.all([
        this.supabase
          .from('alumni_profiles')
          .select('id', { count: 'exact', head: true }),
        
        this.supabase
          .from('alumni_profiles')
          .select('id', { count: 'exact', head: true })
          .gte('last_active', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        
        this.supabase
          .from('alumni_profiles')
          .select('graduation_year', { count: 'exact' })
          .not('graduation_year', 'is', null),
        
        this.supabase
          .from('alumni_profiles')
          .select('squadron', { count: 'exact' })
          .not('squadron', 'is', null),
        
        this.supabase
          .from('alumni_profiles')
          .select('industry', { count: 'exact' })
          .not('industry', 'is', null),
        
        this.supabase
          .from('alumni_profiles')
          .select('location_country', { count: 'exact' })
          .not('location_country', 'is', null),
        
        this.supabase
          .from('alumni_profiles')
          .select('id', { count: 'exact', head: true })
          .eq('is_available_for_mentoring', true),
        
        this.supabase
          .from('alumni_profiles')
          .select('id', { count: 'exact', head: true })
          .eq('is_seeking_mentorship', true),
      ])
      
      return {
        total_alumni: total_alumni.count || 0,
        active_alumni: active_alumni.count || 0,
        graduation_years: graduation_years.data || [],
        squadrons: squadrons.data || [],
        industries: industries.data || [],
        locations: locations.data || [],
        mentors: mentors.count || 0,
        seeking_mentorship: seeking_mentorship.count || 0,
      }
    },
    ['alumni-stats'],
    { revalidate: 3600 } // Cache for 1 hour
  )
  
  /**
   * Get connection requests for a user
   */
  async getConnectionRequests(user_id: string) {
    const { data, error } = await this.supabase
      .from('connection_requests')
      .select(`
        *,
        sender:alumni_profiles!connection_requests_sender_id_fkey(
          *,
          users!inner(firstName, lastName, profilePhoto)
        )
      `)
      .eq('receiver_id', user_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    
    if (error) {
      throw new Error(`Failed to fetch connection requests: ${error.message}`)
    }
    
    return data
  }
  
  /**
   * Send connection request
   */
  async sendConnectionRequest(
    sender_id: string,
    receiver_id: string,
    message?: string
  ) {
    const { data, error } = await this.supabase
      .from('connection_requests')
      .insert({
        sender_id,
        receiver_id,
        message,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to send connection request: ${error.message}`)
    }
    
    return data
  }
  
  // Private helper methods
  
  private applyFilters(query: any, filters: AlumniSearchFilters, viewer_id?: string) {
    // Text search
    if (filters.search) {
      query = query.or(`
        first_name.ilike.%${filters.search}%,
        last_name.ilike.%${filters.search}%,
        current_company.ilike.%${filters.search}%,
        job_title.ilike.%${filters.search}%,
        bio.ilike.%${filters.search}%,
        skills.cs.{${filters.search}}
      `)
    }
    
    // Alumni filters
    if (filters.graduation_year) {
      query = query.eq('graduation_year', filters.graduation_year)
    }
    
    if (filters.graduation_years?.length) {
      query = query.in('graduation_year', filters.graduation_years)
    }
    
    if (filters.squadron) {
      query = query.eq('squadron', filters.squadron)
    }
    
    if (filters.squadrons?.length) {
      query = query.in('squadron', filters.squadrons)
    }
    
    // Professional filters
    if (filters.industry) {
      query = query.ilike('industry', `%${filters.industry}%`)
    }
    
    if (filters.industries?.length) {
      query = query.in('industry', filters.industries)
    }
    
    if (filters.company) {
      query = query.ilike('current_company', `%${filters.company}%`)
    }
    
    // Location filters
    if (filters.location) {
      query = query.or(`
        location_city.ilike.%${filters.location}%,
        location_country.ilike.%${filters.location}%
      `)
    }
    
    if (filters.country) {
      query = query.eq('location_country', filters.country)
    }
    
    if (filters.city) {
      query = query.eq('location_city', filters.city)
    }
    
    // Skills and interests
    if (filters.skills?.length) {
      query = query.overlaps('skills', filters.skills)
    }
    
    if (filters.interests?.length) {
      query = query.overlaps('interests', filters.interests)
    }
    
    // Mentorship
    if (filters.available_for_mentoring) {
      query = query.eq('is_available_for_mentoring', true)
    }
    
    if (filters.seeking_mentorship) {
      query = query.eq('is_seeking_mentorship', true)
    }
    
    // Activity
    if (filters.active_within_days) {
      const cutoff = new Date(Date.now() - filters.active_within_days * 24 * 60 * 60 * 1000)
      query = query.gte('last_active', cutoff.toISOString())
    }
    
    if (filters.verified_only) {
      query = query.eq('is_verified', true)
    }
    
    // Exclude users
    if (filters.exclude_user_ids?.length) {
      query = query.not('user_id', 'in', `(${filters.exclude_user_ids.join(',')})`)
    }
    
    // Exclude self unless specified
    if (!filters.include_self && viewer_id) {
      query = query.neq('user_id', viewer_id)
    }
    
    // Sorting
    const sort_by = filters.sort_by || 'updated_at'
    const sort_order = filters.sort_order || 'desc'
    
    query = query.order(sort_by, { ascending: sort_order === 'asc' })
    
    return query
  }
  
  private async getFacets(filters: AlumniSearchFilters, viewer_id?: string) {
    // This would be implemented to return faceted search results
    // For now, return empty facets
    return {
      graduation_years: [],
      squadrons: [],
      industries: [],
      locations: [],
      skills: [],
      mentorship_areas: [],
    }
  }
  
  private async getSearchSuggestions(query: string): Promise<string[]> {
    if (!query || query.length < 2) return []
    
    // Implement search suggestions based on common searches, skills, companies, etc.
    return []
  }
  
  private async getConnectionCount(user_id: string): Promise<number> {
    const { count } = await this.supabase
      .from('connections')
      .select('id', { count: 'exact', head: true })
      .or(`user1_id.eq.${user_id},user2_id.eq.${user_id}`)
      .eq('status', 'accepted')
    
    return count || 0
  }
  
  private async getMutualConnectionCount(user1_id: string, user2_id: string): Promise<number> {
    // This would be a more complex query to find mutual connections
    // For now, return 0
    return 0
  }
  
  private invalidateUserCache(user_id: string) {
    // Implement cache invalidation logic
    // This would clear relevant caches when a user profile is updated
  }
}

export const enhancedAlumniDirectoryService = new EnhancedAlumniDirectoryService()