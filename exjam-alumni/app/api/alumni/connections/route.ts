import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = (page - 1) * limit;

    // Build query to get connections where user is involved
    let query = supabase
      .from("alumni_connections")
      .select(
        `
        *,
        requester:User!requester_id(
          id,
          firstName,
          lastName,
          fullName,
          profilePhoto,
          email
        ),
        receiver:User!receiver_id(
          id,
          firstName,
          lastName,
          fullName,
          profilePhoto,
          email
        )
      `
      )
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: connections, error } = await query;

    if (error) {
      console.error("Connections fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch connections" }, { status: 500 });
    }

    // Get total count
    let countQuery = supabase
      .from("alumni_connections")
      .select("*", { count: "exact", head: true })
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

    if (status) {
      countQuery = countQuery.eq("status", status);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      connections: connections || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Connections API error:", error);
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
    const { receiver_id, connection_type = "professional", message = "" } = body;

    if (!receiver_id) {
      return NextResponse.json({ error: "Receiver ID is required" }, { status: 400 });
    }

    if (receiver_id === user.id) {
      return NextResponse.json({ error: "Cannot connect to yourself" }, { status: 400 });
    }

    // Check if connection already exists
    const { data: existingConnection, error: checkError } = await supabase
      .from("alumni_connections")
      .select("id, status")
      .or(
        `and(requester_id.eq.${user.id},receiver_id.eq.${receiver_id}),` +
          `and(requester_id.eq.${receiver_id},receiver_id.eq.${user.id})`
      )
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Connection check error:", checkError);
      return NextResponse.json({ error: "Failed to check existing connection" }, { status: 500 });
    }

    if (existingConnection) {
      return NextResponse.json(
        {
          error: "Connection already exists",
          status: existingConnection.status,
        },
        { status: 409 }
      );
    }

    // Create new connection
    const { data, error } = await supabase
      .from("alumni_connections")
      .insert({
        requester_id: user.id,
        receiver_id,
        connection_type,
        message,
        status: "pending",
      })
      .select(
        `
        *,
        requester:User!requester_id(
          id,
          firstName,
          lastName,
          fullName,
          profilePhoto,
          email
        ),
        receiver:User!receiver_id(
          id,
          firstName,
          lastName,
          fullName,
          profilePhoto,
          email
        )
      `
      )
      .single();

    if (error) {
      console.error("Connection creation error:", error);
      return NextResponse.json({ error: "Failed to create connection" }, { status: 500 });
    }

    return NextResponse.json({
      message: "Connection request sent successfully",
      connection: data,
    });
  } catch (error) {
    console.error("Connection request API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
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
    const { connection_id, status } = body;

    if (!connection_id || !status) {
      return NextResponse.json({ error: "Connection ID and status are required" }, { status: 400 });
    }

    if (!["accepted", "declined", "blocked"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Update connection status (only receiver can update)
    const { data, error } = await supabase
      .from("alumni_connections")
      .update({
        status,
        responded_at: new Date().toISOString(),
      })
      .eq("id", connection_id)
      .eq("receiver_id", user.id) // Only receiver can respond
      .select(
        `
        *,
        requester:User!requester_id(
          id,
          firstName,
          lastName,
          fullName,
          profilePhoto,
          email
        ),
        receiver:User!receiver_id(
          id,
          firstName,
          lastName,
          fullName,
          profilePhoto,
          email
        )
      `
      )
      .single();

    if (error) {
      console.error("Connection update error:", error);
      return NextResponse.json({ error: "Failed to update connection" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Connection not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({
      message: `Connection ${status} successfully`,
      connection: data,
    });
  } catch (error) {
    console.error("Connection update API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
