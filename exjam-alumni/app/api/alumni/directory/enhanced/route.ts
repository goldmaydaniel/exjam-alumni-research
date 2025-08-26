import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { enhancedAlumniDirectoryService, AlumniSearchFilters } from "@/lib/services/enhanced-alumni-directory"
import { z } from "zod"

// Enhanced search parameters schema
const searchParamsSchema = z.object({
  // Text Search
  search: z.string().optional(),
  
  // Alumni Filters
  graduation_year: z.coerce.number().optional(),
  graduation_years: z.string().optional().transform(val => 
    val ? val.split(',').map(Number) : undefined
  ),
  squadron: z.enum(['BLUE', 'GREEN', 'PURPLE', 'YELLOW', 'RED']).optional(),
  squadrons: z.string().optional().transform(val => 
    val ? val.split(',') : undefined
  ),
  svc_number: z.string().optional(),
  
  // Professional Filters
  industry: z.string().optional(),
  industries: z.string().optional().transform(val => 
    val ? val.split(',') : undefined
  ),
  company: z.string().optional(),
  job_levels: z.string().optional().transform(val => 
    val ? val.split(',') : undefined
  ),
  experience_min: z.coerce.number().optional(),
  experience_max: z.coerce.number().optional(),
  
  // Location Filters
  location: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  timezone: z.string().optional(),
  coordinates_lat: z.coerce.number().optional(),
  coordinates_lng: z.coerce.number().optional(),
  radius: z.coerce.number().optional(),
  
  // Skills & Interests
  skills: z.string().optional().transform(val => 
    val ? val.split(',') : undefined
  ),
  interests: z.string().optional().transform(val => 
    val ? val.split(',') : undefined
  ),
  languages: z.string().optional().transform(val => 
    val ? val.split(',') : undefined
  ),
  
  // Networking
  available_for_mentoring: z.coerce.boolean().optional(),
  seeking_mentorship: z.coerce.boolean().optional(),
  mentorship_areas: z.string().optional().transform(val => 
    val ? val.split(',') : undefined
  ),
  
  // Activity & Engagement
  active_within_days: z.coerce.number().optional(),
  min_connections: z.coerce.number().optional(),
  verified_only: z.coerce.boolean().optional(),
  
  // Sorting & Pagination
  sort_by: z.enum(['relevance', 'name', 'graduation_year', 'last_active', 'connections']).default('relevance'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  
  // Advanced
  exclude_user_ids: z.string().optional().transform(val => 
    val ? val.split(',') : undefined
  ),
  include_self: z.coerce.boolean().default(false),
})

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Parse and validate search parameters
    const { searchParams } = new URL(req.url)
    const rawParams = Object.fromEntries(searchParams.entries())
    
    const filters = searchParamsSchema.parse(rawParams)
    
    // Transform filters to service format
    const searchFilters: AlumniSearchFilters = {
      search: filters.search,
      graduation_year: filters.graduation_year,
      graduation_years: filters.graduation_years,
      squadron: filters.squadron,
      squadrons: filters.squadrons,
      industry: filters.industry,
      industries: filters.industries,
      company: filters.company,
      job_levels: filters.job_levels,
      experience_range: filters.experience_min && filters.experience_max ? {
        min: filters.experience_min,
        max: filters.experience_max
      } : undefined,
      location: filters.location,
      country: filters.country,
      city: filters.city,
      timezone: filters.timezone,
      coordinates: filters.coordinates_lat && filters.coordinates_lng ? {
        lat: filters.coordinates_lat,
        lng: filters.coordinates_lng,
        radius: filters.radius || 50 // Default 50km radius
      } : undefined,
      skills: filters.skills,
      interests: filters.interests,
      languages: filters.languages,
      available_for_mentoring: filters.available_for_mentoring,
      seeking_mentorship: filters.seeking_mentorship,
      mentorship_areas: filters.mentorship_areas,
      active_within_days: filters.active_within_days,
      min_connections: filters.min_connections,
      verified_only: filters.verified_only,
      sort_by: filters.sort_by,
      sort_order: filters.sort_order,
      page: filters.page,
      limit: filters.limit,
      exclude_user_ids: filters.exclude_user_ids,
      include_self: filters.include_self,
    }
    
    // Perform search
    const results = await enhancedAlumniDirectoryService.searchAlumni(
      searchFilters,
      user?.id
    )
    
    return NextResponse.json({
      success: true,
      data: results,
      message: `Found ${results.pagination.total} alumni profiles`,
    })
    
  } catch (error) {
    console.error('Alumni directory search error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid search parameters',
          details: error.errors,
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search alumni directory',
      },
      { status: 500 }
    )
  }
}

// Alumni profile creation/update schema
const alumniProfileSchema = z.object({
  // Personal Information (from auth user data, read-only in profile)
  
  // Alumni Specific
  graduation_year: z.number().min(1980).max(new Date().getFullYear()).optional(),
  squadron: z.enum(['BLUE', 'GREEN', 'PURPLE', 'YELLOW', 'RED']).optional(),
  svc_number: z.string().min(1).max(20).optional(),
  
  // Professional Information
  current_company: z.string().max(200).optional(),
  job_title: z.string().max(200).optional(),
  industry: z.string().max(100).optional(),
  work_experience: z.number().min(0).max(70).optional(),
  
  // Location Information
  location_city: z.string().max(100).optional(),
  location_country: z.string().max(100).optional(),
  timezone: z.string().max(50).optional(),
  
  // Profile Details
  bio: z.string().max(1000).optional(),
  skills: z.array(z.string().max(50)).max(20).default([]),
  interests: z.array(z.string().max(50)).max(20).default([]),
  languages: z.array(z.string().max(50)).max(10).default([]),
  achievements: z.array(z.string().max(200)).max(10).default([]),
  
  // Social & Networking
  linkedin_profile: z.string().url().optional().or(z.literal('')),
  website_url: z.string().url().optional().or(z.literal('')),
  github_profile: z.string().url().optional().or(z.literal('')),
  twitter_handle: z.string().max(50).optional(),
  
  // Mentorship & Networking
  is_available_for_mentoring: z.boolean().default(false),
  is_seeking_mentorship: z.boolean().default(false),
  is_available_for_networking: z.boolean().default(true),
  mentorship_areas: z.array(z.string().max(50)).max(10).default([]),
  
  // Privacy & Visibility
  is_public: z.boolean().default(true),
  show_email: z.boolean().default(false),
  show_phone: z.boolean().default(false),
  show_location: z.boolean().default(true),
})

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Parse and validate request body
    const body = await req.json()
    const profileData = alumniProfileSchema.parse(body)
    
    // Create or update profile
    const profile = await enhancedAlumniDirectoryService.updateAlumniProfile(
      user.id,
      profileData
    )
    
    return NextResponse.json({
      success: true,
      data: profile,
      message: 'Alumni profile updated successfully',
    })
    
  } catch (error) {
    console.error('Alumni profile update error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid profile data',
          details: error.errors,
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update alumni profile',
      },
      { status: 500 }
    )
  }
}

// Get alumni statistics
export async function PATCH(req: NextRequest) {
  try {
    const stats = await enhancedAlumniDirectoryService.getAlumniStats()
    
    return NextResponse.json({
      success: true,
      data: stats,
      message: 'Alumni statistics retrieved successfully',
    })
    
  } catch (error) {
    console.error('Alumni stats error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get alumni statistics',
      },
      { status: 500 }
    )
  }
}