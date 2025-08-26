import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUserFromToken(token: string) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

async function getAuthToken(req: NextRequest) {
  // Try to get token from Authorization header first
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Fallback to cookies
  const cookieStore = await cookies();
  return cookieStore.get("auth-token")?.value;
}

export async function POST(request: NextRequest) {
  try {
    const token = await getAuthToken(request);

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = await getUserFromToken(token);
    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: "Target user ID required" }, { status: 400 });
    }

    // Get requester's alumni profile
    const { data: requesterProfile, error: requesterError } = await supabase
      .from("alumni_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (requesterError || !requesterProfile) {
      return NextResponse.json({ error: "Requester profile not found" }, { status: 404 });
    }

    // Check if connection already exists
    const { data: existingConnection } = await supabase
      .from("alumni_connections")
      .select("*")
      .or(`requester_id.eq.${requesterProfile.id},receiver_id.eq.${requesterProfile.id}`)
      .or(`requester_id.eq.${targetUserId},receiver_id.eq.${targetUserId}`)
      .single();

    if (existingConnection) {
      return NextResponse.json(
        {
          error: "Connection already exists",
          status: existingConnection.status,
        },
        { status: 400 }
      );
    }

    // Create new connection request
    const { data, error } = await supabase
      .from("alumni_connections")
      .insert({
        requester_id: requesterProfile.id,
        receiver_id: targetUserId,
        status: "pending",
        message: body.message,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating connection:", error);
      return NextResponse.json({ error: "Failed to create connection" }, { status: 500 });
    }

    // Log activity
    await supabase.from("alumni_activities").insert({
      alumni_id: requesterProfile.id,
      activity_type: "connection_request",
      activity_data: {
        target_id: targetUserId,
        message: body.message,
      },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in connection API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = await getAuthToken(request);

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = await getUserFromToken(token);
    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { connectionId, status } = body;

    if (!connectionId || !status) {
      return NextResponse.json({ error: "Connection ID and status required" }, { status: 400 });
    }

    if (!["accepted", "rejected", "blocked"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Get user's alumni profile
    const { data: userProfile, error: profileError } = await supabase
      .from("alumni_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    // Update connection status (only receiver can accept/reject)
    const { data, error } = await supabase
      .from("alumni_connections")
      .update({
        status,
        connected_at: status === "accepted" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", connectionId)
      .eq("receiver_id", userProfile.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating connection:", error);
      return NextResponse.json({ error: "Failed to update connection" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Connection not found or unauthorized" }, { status: 404 });
    }

    // Log activity
    if (status === "accepted") {
      await supabase.from("alumni_activities").insert({
        alumni_id: userProfile.id,
        activity_type: "connection_accepted",
        activity_data: {
          requester_id: data.requester_id,
        },
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in connection PATCH:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = await getAuthToken(request);

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = await getUserFromToken(token);
    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get user's alumni profile
    const { data: userProfile, error: profileError } = await supabase
      .from("alumni_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    // Get all connections for the user
    const { data, error } = await supabase
      .from("alumni_connections")
      .select(
        `
        *,
        requester:alumni_profiles!alumni_connections_requester_id_fkey(
          id, first_name, last_name, squadron, set_number, profile_photo_url
        ),
        receiver:alumni_profiles!alumni_connections_receiver_id_fkey(
          id, first_name, last_name, squadron, set_number, profile_photo_url
        )
      `
      )
      .or(`requester_id.eq.${userProfile.id},receiver_id.eq.${userProfile.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching connections:", error);
      return NextResponse.json({ error: "Failed to fetch connections" }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error in connection GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
