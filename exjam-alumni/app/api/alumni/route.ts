import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const squadron = searchParams.get("squadron");
    const chapter = searchParams.get("chapter");
    const set = searchParams.get("set");
    const search = searchParams.get("search");

    // Use the alumni_profiles table directly (since we have demo data there)
    let query = supabase
      .from("alumni_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    // Apply filters
    if (squadron && squadron !== "all") {
      query = query.eq("squadron", squadron.toUpperCase());
    }

    if (chapter && chapter !== "All Chapters") {
      query = query.eq("chapter", chapter);
    }

    if (set && set !== "all") {
      query = query.eq("set_number", set);
    }

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,service_number.ilike.%${search}%,current_location.ilike.%${search}%,occupation.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching alumni:", error);
      return NextResponse.json({ error: "Failed to fetch alumni" }, { status: 500 });
    }

    // Transform data to match frontend expectations
    const transformedData =
      data?.map((alumni) => ({
        id: alumni.id,
        firstName: alumni.first_name,
        lastName: alumni.last_name,
        email:
          alumni.email ||
          alumni.first_name.toLowerCase() + "." + alumni.last_name.toLowerCase() + "@email.com",
        phone: alumni.phone,
        serviceNumber: alumni.service_number,
        set: alumni.set_number,
        squadron: alumni.squadron ? alumni.squadron.toLowerCase() : "green",
        chapter: alumni.chapter || "Abuja Chapter",
        currentLocation: alumni.current_location || "Nigeria",
        country: alumni.country || "Nigeria",
        occupation: alumni.occupation || "Military Officer",
        company: alumni.company || "Nigerian Armed Forces",
        linkedIn: alumni.linkedin_url,
        profilePhoto: alumni.profile_photo_url || "/api/placeholder/150/150",
        graduationYear: alumni.graduation_year,
        achievements: alumni.achievements || [],
        isVerified: alumni.is_verified !== false,
        joinedDate: alumni.created_at,
        lastActive: alumni.last_active || alumni.updated_at || alumni.created_at,
        connectionStatus: "none", // Will need to be fetched separately if needed
        membershipStatus: "active",
        membershipType: "annual",
        membershipExpires: null,
      })) || [];

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("Error in alumni API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.userId || !body.firstName || !body.lastName || !body.serviceNumber) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Extract set number from service number
    const setMatch = body.serviceNumber.match(/AFMS (\d+)\//);
    const setNumber = setMatch ? setMatch[1] : "00";

    // Extract graduation year from service number
    const yearMatch = body.serviceNumber.match(/AFMS \d+\/(\d{4})/);
    const graduationYear = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();

    // Create alumni profile
    const { data, error } = await supabase
      .from("alumni_profiles")
      .insert({
        user_id: body.userId,
        first_name: body.firstName,
        last_name: body.lastName,
        service_number: body.serviceNumber,
        set_number: setNumber,
        squadron: body.squadron.toUpperCase(),
        graduation_year: graduationYear,
        phone: body.phone,
        chapter: body.chapter,
        current_location: body.currentLocation,
        country: body.country || "Nigeria",
        occupation: body.occupation,
        company: body.company,
        linkedin_url: body.linkedIn,
        profile_photo_url: body.profilePhoto,
        bio: body.bio,
        interests: body.interests || [],
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating alumni profile:", error);
      return NextResponse.json({ error: "Failed to create alumni profile" }, { status: 500 });
    }

    // Log activity
    await supabase.from("alumni_activities").insert({
      alumni_id: data.id,
      activity_type: "joined",
      activity_data: {
        name: `${body.firstName} ${body.lastName}`,
        squadron: body.squadron,
        set: setNumber,
      },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in alumni POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
