import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const eventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  venue: z.string().min(1),
  address: z.string().optional(),
  capacity: z.number().int().positive(),
  price: z.number().nonnegative(),
  imageUrl: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED"]).default("DRAFT"),
});

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const showPast = searchParams.get("showPast") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build Supabase query
    let query = supabase
      .from("Event")
      .select(
        `
        id,
        title,
        description,
        shortDescription,
        startDate,
        endDate,
        venue,
        address,
        capacity,
        price,
        imageUrl,
        status,
        createdAt,
        organizerId
      `,
        { count: "exact" }
      )
      .range(offset, offset + limit - 1)
      .order("startDate", { ascending: true });

    // Check if user is authenticated to determine what events they can see
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const isAuthenticated = !!user;

    // Apply status filter
    if (!status) {
      if (isAuthenticated) {
        // Authenticated users can see all their events and published events
        query = query.or(`status.eq.PUBLISHED,organizerId.eq.${user.id}`);
      } else {
        // Non-authenticated users only see published events
        query = query.eq("status", "PUBLISHED");
      }
    } else if (status !== "ALL") {
      query = query.eq("status", status);
    }

    // By default, show only future events unless showPast is true
    if (!showPast) {
      query = query.gte("endDate", new Date().toISOString());
    }

    // Search functionality - using textual search
    if (search) {
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%,venue.ilike.%${search}%`
      );
    }

    // Price filtering
    if (minPrice) {
      query = query.gte("price", parseFloat(minPrice));
    }
    if (maxPrice) {
      query = query.lte("price", parseFloat(maxPrice));
    }

    // Date filtering
    if (startDate) {
      query = query.gte("startDate", startDate);
    }
    if (endDate) {
      query = query.lte("startDate", endDate);
    }

    const { data: events, error: eventsError, count } = await query;

    if (eventsError) {
      console.error("Events fetch error:", eventsError);
      return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
    }

    // For each event, get registration count
    const eventsWithCounts = await Promise.all(
      (events || []).map(async (event) => {
        const { count: registrationCount, error: countError } = await supabase
          .from("Registration")
          .select("*", { count: "exact", head: true })
          .eq("eventId", event.id)
          .neq("status", "CANCELLED");

        return {
          ...event,
          registrationCount: countError ? 0 : registrationCount || 0,
          availableSpots: event.capacity - (countError ? 0 : registrationCount || 0),
        };
      })
    );

    return NextResponse.json({
      events: eventsWithCounts,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Events API error:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin or organizer
    const { data: userData, error: userError } = await supabase
      .from("User")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !userData || !["ADMIN", "ORGANIZER"].includes(userData.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = eventSchema.parse(body);

    // Create event using Supabase client
    const { data: event, error: eventError } = await supabase
      .from("Event")
      .insert({
        id: crypto.randomUUID(),
        ...validatedData,
        organizerId: user.id,
        startDate: validatedData.startDate.toISOString(),
        endDate: validatedData.endDate.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (eventError) {
      console.error("Event creation error:", eventError);
      return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
    }

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.flatten() },
        { status: 400 }
      );
    }

    console.error("Event creation error:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
