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
    const { registrationId } = await params;

    // Allow anonymous access for downloads (badge URLs can be shared)
    // But still validate the registration exists and is paid

    // Fetch registration data
    const { data: registration, error: regError } = await supabase
      .from("registrations")
      .select(
        `
        *,
        user:users(*),
        event:events(*)
      `
      )
      .eq("id", registrationId)
      .single();

    if (regError || !registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    // Only allow badge download for paid registrations
    if (registration.payment_status !== "paid") {
      return NextResponse.json(
        {
          error: "Badge not available - payment required",
        },
        { status: 402 }
      );
    }

    const badgeService = new BadgeService();
    const badgeSvg = await badgeService.generateBadgeWithQR(registration);

    // Update badge access log
    try {
      await supabase.from("badge_access_logs").insert({
        registration_id: registrationId,
        user_id: registration.user_id,
        access_type: "download",
        accessed_at: new Date().toISOString(),
        ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
      });
    } catch (logError) {
      console.error("Failed to log badge access:", logError);
    }

    return new Response(badgeSvg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": `attachment; filename="EXJAM-Badge-${registration.ticket_id}.svg"`,
        "Cache-Control": "public, max-age=1800", // 30 minutes cache
        "X-Badge-Generated": new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Badge download error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
