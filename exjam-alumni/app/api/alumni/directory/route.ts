import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get search parameters
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const industry = searchParams.get("industry") || "";
    const location = searchParams.get("location") || "";
    const graduationYear = searchParams.get("graduationYear") || "";
    const isMentoring = searchParams.get("mentoring") === "true";
    const isSeekingMentorship = searchParams.get("seeking") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("alumni_profiles")
      .select("*")
      .eq("is_public", true)
      .order("updated_at", { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`
        current_company.ilike.%${search}%,
        job_title.ilike.%${search}%,
        bio.ilike.%${search}%
      `);
    }

    if (industry) {
      query = query.ilike("industry", `%${industry}%`);
    }

    if (location) {
      query = query.or(`
        location_city.ilike.%${location}%,
        location_country.ilike.%${location}%
      `);
    }

    if (graduationYear) {
      query = query.eq("graduation_year", parseInt(graduationYear));
    }

    if (isMentoring) {
      query = query.eq("is_available_for_mentoring", true);
    }

    if (isSeekingMentorship) {
      query = query.eq("is_seeking_mentorship", true);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: profiles, error } = await query;

    if (error) {
      console.error("Alumni directory error:", error);
      return NextResponse.json({ error: "Failed to fetch alumni directory" }, { status: 500 });
    }

    // Fetch user data for each profile
    const userIds = profiles?.map((p) => p.user_id).filter(Boolean) || [];
    const { data: users } =
      userIds.length > 0
        ? await supabase
            .from("User")
            .select("id, firstName, lastName, fullName, profilePhoto, email")
            .in("id", userIds)
        : { data: [] };

    // Combine profile and user data
    const enhancedProfiles =
      profiles?.map((profile) => ({
        ...profile,
        user: users?.find((u) => u.id === profile.user_id),
      })) || [];

    // Get total count for pagination
    let countQuery = supabase
      .from("alumni_profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_public", true);

    // Apply same filters to count query
    if (search) {
      countQuery = countQuery.or(`
        current_company.ilike.%${search}%,
        job_title.ilike.%${search}%,
        bio.ilike.%${search}%
      `);
    }

    if (industry) {
      countQuery = countQuery.ilike("industry", `%${industry}%`);
    }

    if (location) {
      countQuery = countQuery.or(`
        location_city.ilike.%${location}%,
        location_country.ilike.%${location}%
      `);
    }

    if (graduationYear) {
      countQuery = countQuery.eq("graduation_year", parseInt(graduationYear));
    }

    if (isMentoring) {
      countQuery = countQuery.eq("is_available_for_mentoring", true);
    }

    if (isSeekingMentorship) {
      countQuery = countQuery.eq("is_seeking_mentorship", true);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      profiles: enhancedProfiles,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Alumni directory API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate required fields
    const {
      graduation_year,
      current_company,
      job_title,
      industry,
      location_city,
      location_country,
      bio,
      skills,
      interests,
      linkedin_profile,
      website_url,
      is_available_for_mentoring,
      is_seeking_mentorship,
      is_available_for_networking,
      is_public,
    } = body;

    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from("alumni_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Profile check error:", checkError);
      return NextResponse.json({ error: "Failed to check profile" }, { status: 500 });
    }

    const profileData = {
      user_id: user.id,
      graduation_year: graduation_year ? parseInt(graduation_year) : null,
      current_company,
      job_title,
      industry,
      location_city,
      location_country: location_country || "Nigeria",
      bio,
      skills: Array.isArray(skills) ? skills : [],
      interests: Array.isArray(interests) ? interests : [],
      linkedin_profile,
      website_url,
      is_available_for_mentoring: !!is_available_for_mentoring,
      is_seeking_mentorship: !!is_seeking_mentorship,
      is_available_for_networking: is_available_for_networking !== false,
      is_public: is_public !== false,
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
      console.error("Profile save error:", result.error);
      return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
    }

    return NextResponse.json({
      message: existingProfile ? "Profile updated successfully" : "Profile created successfully",
      profile: result.data,
    });
  } catch (error) {
    console.error("Alumni profile API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
