import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { id: eventId } = params;
    const { searchParams } = new URL(req.url);
    const resourceType = searchParams.get("type") || "";

    // Check if user is authenticated for private resources
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let query = supabase
      .from("event_resources")
      .select(
        `
        id,
        event_id,
        title,
        description,
        resource_type,
        resource_url,
        file_size,
        mime_type,
        is_public,
        requires_registration,
        download_count,
        created_at,
        uploader:User!uploaded_by(
          id,
          firstName,
          lastName,
          fullName
        )
      `
      )
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (resourceType) {
      query = query.eq("resource_type", resourceType);
    }

    // Filter based on authentication and registration status
    if (!user) {
      query = query.eq("is_public", true).eq("requires_registration", false);
    } else {
      // For authenticated users, check if they're registered for private resources
      const { data: registration } = await supabase
        .from("Registration")
        .select("id")
        .eq("eventId", eventId)
        .eq("userId", user.id)
        .single();

      if (!registration) {
        // Not registered - only show public resources that don't require registration
        query = query.eq("is_public", true).eq("requires_registration", false);
      }
      // If registered, show all public resources and registration-required resources
    }

    const { data: resources, error } = await query;

    if (error) {
      console.error("Resources fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch resources" }, { status: 500 });
    }

    // Group resources by type
    const resourcesByType =
      resources?.reduce(
        (acc, resource) => {
          const type = resource.resource_type;
          if (!acc[type]) {
            acc[type] = [];
          }
          acc[type].push(resource);
          return acc;
        },
        {} as Record<string, any[]>
      ) || {};

    return NextResponse.json({
      resources: resources || [],
      byType: resourcesByType,
      total: resources?.length || 0,
    });
  } catch (error) {
    console.error("Resources API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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

    const { id: eventId } = params;

    // Check if user is admin or event organizer
    const { data: userProfile } = await supabase
      .from("User")
      .select("role")
      .eq("id", user.id)
      .single();

    const { data: event } = await supabase
      .from("Event")
      .select("organizerId")
      .eq("id", eventId)
      .single();

    if (
      !userProfile ||
      (userProfile.role !== "ADMIN" &&
        userProfile.role !== "ORGANIZER" &&
        event?.organizerId !== user.id)
    ) {
      return NextResponse.json(
        {
          error: "Only event organizers and admins can add resources",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      resource_type,
      resource_url,
      file_path,
      file_size,
      mime_type,
      is_public = true,
      requires_registration = false,
    } = body;

    // Validate required fields
    if (!title || !resource_type) {
      return NextResponse.json(
        {
          error: "Title and resource type are required",
        },
        { status: 400 }
      );
    }

    if (!resource_url && !file_path) {
      return NextResponse.json(
        {
          error: "Either resource URL or file path must be provided",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("event_resources")
      .insert({
        event_id: eventId,
        title,
        description,
        resource_type,
        resource_url,
        file_path,
        file_size,
        mime_type,
        is_public,
        requires_registration,
        uploaded_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(
        `
        id,
        event_id,
        title,
        description,
        resource_type,
        resource_url,
        file_size,
        mime_type,
        is_public,
        requires_registration,
        download_count,
        created_at,
        uploader:User!uploaded_by(
          id,
          firstName,
          lastName,
          fullName
        )
      `
      )
      .single();

    if (error) {
      console.error("Resource creation error:", error);
      return NextResponse.json({ error: "Failed to add resource" }, { status: 500 });
    }

    return NextResponse.json({
      message: "Resource added successfully",
      resource: data,
    });
  } catch (error) {
    console.error("Add resource API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Download tracking endpoint
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { resource_id } = body;

    if (!resource_id) {
      return NextResponse.json({ error: "Resource ID is required" }, { status: 400 });
    }

    // Increment download count
    const { error } = await supabase
      .from("event_resources")
      .update({
        download_count: supabase.raw("download_count + 1"),
      })
      .eq("id", resource_id);

    if (error) {
      console.error("Download count update error:", error);
      return NextResponse.json({ error: "Failed to update download count" }, { status: 500 });
    }

    return NextResponse.json({ message: "Download recorded" });
  } catch (error) {
    console.error("Download tracking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
