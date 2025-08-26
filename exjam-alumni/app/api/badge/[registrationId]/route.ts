import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BadgeService } from "@/lib/edge-functions/badge-service";

interface RouteParams {
  params: {
    registrationId: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { registrationId } = params;

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch registration data
    const { data: registration, error: regError } = await supabase
      .from("Registration")
      .select(
        `
        *,
        user:User!userId(*),
        event:Event!eventId(*)
      `
      )
      .eq("id", registrationId)
      .single();

    if (regError || !registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    // Check if user owns this registration or is admin
    const { data: userProfile } = await supabase
      .from("User")
      .select("role")
      .eq("id", user.id)
      .single();

    const isOwner = registration.userId === user.id;
    const isAdmin = userProfile?.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const badgeService = new BadgeService();
    const badgeSvg = await badgeService.generateBadgeWithQR(registration);

    // Update registration with badge generated flag
    await supabase
      .from("Registration")
      .update({
        badgeGenerated: true,
        badgeGeneratedAt: new Date().toISOString(),
        qrData: badgeService.generateQRData({
          registrationId: registration.id,
          userId: registration.userId,
          eventId: registration.eventId,
          ticketId: registration.id, // Using registration id as ticket reference
        }),
      })
      .eq("id", registrationId)
      .catch((error) => {
        console.error("Failed to update badge generated status:", error);
      });

    return new Response(badgeSvg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": `inline; filename="badge-${registration.ticket_id}.svg"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Badge generation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { registrationId } = params;

    // Check authentication - admin only for POST
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from("User")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userProfile?.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Fetch registration data
    const { data: registration, error: regError } = await supabase
      .from("Registration")
      .select(
        `
        *,
        user:User!userId(*),
        event:Event!eventId(*)
      `
      )
      .eq("id", registrationId)
      .single();

    if (regError || !registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    const badgeService = new BadgeService();
    const qrData = badgeService.generateQRData({
      registrationId: registration.id,
      userId: registration.userId,
      eventId: registration.eventId,
      ticketId: registration.id,
    });

    // Update registration with QR data and badge info
    const { error: updateError } = await supabase
      .from("Registration")
      .update({
        badgeGenerated: true,
        badgeGeneratedAt: new Date().toISOString(),
        qrData: qrData,
      })
      .eq("id", registrationId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update registration" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      registrationId,
      qrData,
      badgeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/badge/${registrationId}`,
      downloadUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/badge/${registrationId}/download`,
    });
  } catch (error) {
    console.error("Badge POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
