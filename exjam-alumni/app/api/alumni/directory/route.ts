import { NextRequest, NextResponse } from "next/server";
import { withOptionalAuth } from "@/lib/middleware/auth-middleware";
import { alumniDirectoryService } from "@/lib/services/alumni-directory";
import { withRateLimit, rateLimitConfigs } from "@/lib/rate-limit";
import { withErrorHandling, withValidation } from "@/lib/middleware/error-middleware";
import { createError } from "@/lib/errors/api-errors";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const searchParamsSchema = z.object({
  search: z.string().optional(),
  graduation: z.string().optional(),
  squadron: z.enum(['GREEN', 'RED', 'PURPLE', 'YELLOW', 'DORNIER', 'PUMA']).optional(),
  location: z.string().optional(),
  industry: z.string().optional(),
  mentoring: z.coerce.boolean().optional(),
  seeking: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export const GET = withErrorHandling(async (req: NextRequest) => {
  return withRateLimit(req, rateLimitConfigs.public, async () => {
    return withOptionalAuth()(async (req, user) => {
      // Parse and validate search parameters
      const { searchParams } = new URL(req.url);
      const filters = searchParamsSchema.parse({
        search: searchParams.get("search"),
        graduation: searchParams.get("graduation"),
        squadron: searchParams.get("squadron"),
        location: searchParams.get("location"),
        industry: searchParams.get("industry"),
        mentoring: searchParams.get("mentoring"),
        seeking: searchParams.get("seeking"),
        page: searchParams.get("page"),
        limit: searchParams.get("limit"),
      });

      // Use the optimized alumni directory service
      const result = await alumniDirectoryService.searchAlumni(
        filters,
        user?.id
      );

      return NextResponse.json(result);
    })(req);
  });
});

const alumniProfileSchema = z.object({
  graduation_year: z.string().optional().transform(val => val ? parseInt(val) : null),
  current_company: z.string().optional(),
  job_title: z.string().optional(),
  industry: z.string().optional(),
  location_city: z.string().optional(),
  location_country: z.string().default("Nigeria"),
  bio: z.string().optional(),
  skills: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
  linkedin_profile: z.string().url().optional().or(z.literal('')),
  website_url: z.string().url().optional().or(z.literal('')),
  is_available_for_mentoring: z.boolean().default(false),
  is_seeking_mentorship: z.boolean().default(false),
  is_available_for_networking: z.boolean().default(true),
  is_public: z.boolean().default(true),
});

export const POST = withValidation(
  alumniProfileSchema,
  async (req: NextRequest, validatedData) => {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw createError.unauthorized('Authentication required to create profile', req.nextUrl.pathname);
    }

    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from("alumni_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      throw createError.databaseError('profile check', checkError.message, req.nextUrl.pathname);
    }

    const profileData = {
      user_id: user.id,
      ...validatedData,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from("alumni_profiles")
        .update(profileData)
        .eq("user_id", user.id)
        .select()
        .single();

      result = { data, error };
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from("alumni_profiles")
        .insert({
          ...profileData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      result = { data, error };
    }

    if (result.error) {
      throw createError.databaseError(
        existingProfile ? 'profile update' : 'profile creation', 
        result.error.message, 
        req.nextUrl.pathname
      );
    }

    return NextResponse.json({
      message: existingProfile ? "Profile updated successfully" : "Profile created successfully",
      profile: result.data,
    });
  }
);
