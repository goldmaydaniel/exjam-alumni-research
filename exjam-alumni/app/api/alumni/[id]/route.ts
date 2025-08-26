import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Alumni ID required" }, { status: 400 });
    }

    // Fetch alumni profile with connection status
    const { data, error } = await supabase
      .from("alumni_directory")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching alumni profile:", error);
      return NextResponse.json({ error: "Alumni not found" }, { status: 404 });
    }

    // Transform data to match frontend expectations
    const transformedData = {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      serviceNumber: data.service_number,
      set: data.set_number,
      squadron: data.squadron.toLowerCase(),
      chapter: data.chapter,
      currentLocation: data.current_location,
      country: data.country,
      occupation: data.occupation,
      company: data.company,
      linkedIn: data.linkedin_url,
      profilePhoto: data.profile_photo_url,
      graduationYear: data.graduation_year,
      bio: data.bio,
      achievements: data.achievements || [],
      interests: data.interests || [],
      isVerified: data.is_verified,
      joinedDate: data.created_at,
      lastActive: data.last_active,
      connectionStatus: data.connection_status || "none",
      profileVisibility: data.profile_visibility,
    };

    // Fetch recent activities
    const { data: activities } = await supabase
      .from("alumni_activities")
      .select("*")
      .eq("alumni_id", id)
      .order("created_at", { ascending: false })
      .limit(10);

    // Fetch connections count
    const { count: connectionsCount } = await supabase
      .from("alumni_connections")
      .select("*", { count: "exact", head: true })
      .eq("status", "accepted")
      .or(`requester_id.eq.${id},receiver_id.eq.${id}`);

    return NextResponse.json({
      ...transformedData,
      activities: activities || [],
      connectionsCount: connectionsCount || 0,
    });
  } catch (error) {
    console.error("Error in alumni profile API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Alumni ID required" }, { status: 400 });
    }

    // Update alumni profile
    const { data, error } = await supabase
      .from("alumni_profiles")
      .update({
        first_name: body.firstName,
        last_name: body.lastName,
        phone: body.phone,
        current_location: body.currentLocation,
        country: body.country,
        occupation: body.occupation,
        company: body.company,
        linkedin_url: body.linkedIn,
        bio: body.bio,
        interests: body.interests,
        profile_visibility: body.profileVisibility,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating alumni profile:", error);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    // Log activity
    await supabase.from("alumni_activities").insert({
      alumni_id: id,
      activity_type: "updated_profile",
      activity_data: {
        updated_fields: Object.keys(body),
      },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in alumni profile PATCH:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
