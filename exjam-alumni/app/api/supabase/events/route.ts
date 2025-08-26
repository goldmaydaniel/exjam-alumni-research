import { NextRequest, NextResponse } from "next/server";
import { supabaseDb } from "@/lib/supabase/database";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const featured = searchParams.get("featured");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const filters = {
      ...(search && { search }),
      ...(type && { type }),
      ...(featured !== null && { featured: featured === "true" }),
      limit,
      offset,
    };

    const result = await supabaseDb.getEvents(filters);

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    // Get total count for pagination
    const { count } = await supabaseDb.client
      .from("Event")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      events: result.data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: offset + limit < (count || 0),
      },
    });
  } catch (error) {
    console.error("Supabase events fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    const user = await verifyToken(token);

    if (!user || !["ADMIN", "ORGANIZER"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const eventData = await request.json();

    const result = await supabaseDb.createEvent({
      ...eventData,
      createdBy: user.userId,
      createdAt: new Date().toISOString(),
    });

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Supabase event creation error:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
