import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BadgeGenerator } from "@/lib/badge-generator";

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
    const {
      qr_code_data,
      scan_type = "checkin",
      scan_location = "main_entrance",
      session_id,
      notes,
    } = body;

    if (!qr_code_data) {
      return NextResponse.json({ error: "QR code data is required" }, { status: 400 });
    }

    // Verify QR code data
    const verification = BadgeGenerator.verifyQRCodeData(qr_code_data);
    if (!verification.valid) {
      return NextResponse.json(
        {
          error: "Invalid QR code",
          details: verification.error,
        },
        { status: 400 }
      );
    }

    const qrData = verification.data!;

    // Get badge information
    const { data: badge, error: badgeError } = await supabase
      .from("event_badges")
      .select(
        `
        *,
        event:Event!event_id(
          id,
          title,
          startDate,
          endDate,
          status
        ),
        user:User!user_id(
          id,
          firstName,
          lastName,
          fullName,
          profilePhoto,
          email
        ),
        registration:Registration!registration_id(
          id,
          status,
          ticketType
        )
      `
      )
      .eq("id", qrData.badgeId)
      .eq("event_id", qrData.eventId)
      .eq("user_id", qrData.userId)
      .single();

    if (badgeError || !badge) {
      return NextResponse.json({ error: "Badge not found or invalid" }, { status: 404 });
    }

    // Check if registration is valid
    if (badge.registration.status !== "CONFIRMED") {
      return NextResponse.json(
        {
          error: "Registration not confirmed",
          badge: {
            id: badge.id,
            user: badge.user,
            registrationStatus: badge.registration.status,
          },
        },
        { status: 403 }
      );
    }

    // Check if event is active
    if (badge.event.status === "CANCELLED") {
      return NextResponse.json({ error: "Event has been cancelled" }, { status: 403 });
    }

    // Check for duplicate scans (within 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const { data: recentScan } = await supabase
      .from("badge_scans")
      .select("id, scanned_at")
      .eq("badge_id", qrData.badgeId)
      .eq("scan_type", scan_type)
      .eq("scan_location", scan_location)
      .gte("scanned_at", fiveMinutesAgo.toISOString())
      .single();

    if (recentScan) {
      return NextResponse.json(
        {
          error: "Duplicate scan detected",
          message: "This badge was already scanned recently",
          badge: {
            id: badge.id,
            user: badge.user,
            lastScan: recentScan.scanned_at,
          },
        },
        { status: 409 }
      );
    }

    // Get client IP and user agent
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(/, /)[0] : req.headers.get("x-real-ip");
    const userAgent = req.headers.get("user-agent");

    // Record the scan
    const { data: scanRecord, error: scanError } = await supabase
      .from("badge_scans")
      .insert({
        badge_id: qrData.badgeId,
        event_id: qrData.eventId,
        session_id,
        scan_type,
        scan_location,
        scanned_by: user.id,
        ip_address: ip,
        user_agent: userAgent,
        notes,
        scanned_at: new Date().toISOString(),
        metadata: {
          qr_timestamp: qrData.timestamp,
          scanner_user: user.id,
        },
      })
      .select()
      .single();

    if (scanError) {
      console.error("Scan recording error:", scanError);
      return NextResponse.json({ error: "Failed to record scan" }, { status: 500 });
    }

    // Update badge scan statistics
    const updateData: any = {
      scan_count: badge.scan_count + 1,
      last_scan_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Update first scan time if this is the first scan
    if (!badge.first_scan_at) {
      updateData.first_scan_at = new Date().toISOString();
    }

    // Update badge status based on scan type
    if (scan_type === "checkin" && badge.status === "generated") {
      updateData.status = "scanned";
    }

    await supabase.from("event_badges").update(updateData).eq("id", qrData.badgeId);

    // Update session attendance if session_id provided
    if (session_id) {
      await supabase.from("session_attendance").upsert(
        {
          session_id,
          user_id: qrData.userId,
          registration_id: qrData.registrationId,
          attendance_status: scan_type === "checkin" ? "attended" : "registered",
          checked_in_at: scan_type === "checkin" ? new Date().toISOString() : null,
        },
        {
          onConflict: "session_id,user_id",
        }
      );
    }

    return NextResponse.json({
      message: "Check-in successful",
      scan: scanRecord,
      attendee: {
        id: badge.user.id,
        name: badge.user.fullName || `${badge.user.firstName} ${badge.user.lastName}`,
        email: badge.user.email,
        profilePhoto: badge.user.profilePhoto,
        ticketType: badge.registration.ticketType,
        badgeType: badge.badge_type,
      },
      event: {
        id: badge.event.id,
        title: badge.event.title,
      },
      scanStats: {
        totalScans: updateData.scan_count,
        firstScan: updateData.first_scan_at || badge.first_scan_at,
        scanType: scan_type,
        location: scan_location,
      },
    });
  } catch (error) {
    console.error("Badge scan API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
    const eventId = searchParams.get("eventId");
    const scanType = searchParams.get("scanType");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    let query = supabase
      .from("badge_scans")
      .select(
        `
        *,
        badge:event_badges!badge_id(
          id,
          display_name,
          badge_type,
          user:User!user_id(
            id,
            firstName,
            lastName,
            fullName,
            profilePhoto
          )
        ),
        scanner:User!scanned_by(
          id,
          firstName,
          lastName,
          fullName
        )
      `
      )
      .eq("event_id", eventId)
      .order("scanned_at", { ascending: false })
      .limit(limit);

    if (scanType) {
      query = query.eq("scan_type", scanType);
    }

    const { data: scans, error } = await query;

    if (error) {
      console.error("Scans fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch scans" }, { status: 500 });
    }

    // Get scan statistics
    const { data: stats } = await supabase
      .from("badge_scans")
      .select("scan_type, scan_location")
      .eq("event_id", eventId);

    const statistics = {
      total: stats?.length || 0,
      byType:
        stats?.reduce(
          (acc, scan) => {
            acc[scan.scan_type] = (acc[scan.scan_type] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ) || {},
      byLocation:
        stats?.reduce(
          (acc, scan) => {
            acc[scan.scan_location] = (acc[scan.scan_location] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ) || {},
    };

    return NextResponse.json({
      scans: scans || [],
      statistics,
      total: scans?.length || 0,
    });
  } catch (error) {
    console.error("Get scans API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
