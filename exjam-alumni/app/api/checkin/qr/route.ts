import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const checkInSchema = z.object({
  qrData: z.string().optional(),
  registrationId: z.string().optional(),
  ticketId: z.string().optional(),
  location: z.string().default("Main Entrance"),
  adminId: z.string().optional(),
});

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

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userProfile?.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { qrData, registrationId, ticketId, location, adminId } = checkInSchema.parse(body);

    let finalRegistrationId = registrationId;

    // Handle QR code check-in
    if (qrData && !finalRegistrationId) {
      try {
        const parsedQR = JSON.parse(qrData);
        finalRegistrationId = parsedQR.registrationId;
      } catch (error) {
        return NextResponse.json({ error: "Invalid QR code format" }, { status: 400 });
      }
    }

    if (!finalRegistrationId && !ticketId) {
      return NextResponse.json(
        {
          error: "registrationId, ticketId, or qrData is required",
        },
        { status: 400 }
      );
    }

    // Fetch registration
    let query = supabase.from("registrations").select(`
        *,
        user:users(*),
        event:events(*)
      `);

    if (finalRegistrationId) {
      query = query.eq("id", finalRegistrationId);
    } else if (ticketId) {
      query = query.eq("ticket_id", ticketId);
    }

    const { data: registration, error: regError } = await query.single();

    if (regError || !registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    // Check if already checked in
    if (registration.checked_in) {
      return NextResponse.json({
        success: false,
        registration,
        message: `Already checked in at ${new Date(registration.checked_in_at).toLocaleString()}`,
        checkInTime: registration.checked_in_at,
      });
    }

    // Check payment status
    if (registration.payment_status !== "paid") {
      return NextResponse.json(
        {
          error: `Payment not confirmed. Status: ${registration.payment_status}`,
        },
        { status: 402 }
      );
    }

    // Perform check-in
    const checkInTime = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("registrations")
      .update({
        checked_in: true,
        checked_in_at: checkInTime,
        check_in_location: location,
        checked_in_by: adminId || user.id,
      })
      .eq("id", registration.id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to check in" }, { status: 500 });
    }

    // Log check-in activity
    try {
      await supabase.from("check_in_logs").insert({
        registration_id: registration.id,
        user_id: registration.user_id,
        event_id: registration.event_id,
        admin_id: adminId || user.id,
        location,
        checked_in_at: checkInTime,
        method: qrData ? "qr_code" : "manual",
        metadata: qrData ? { qr_data: qrData } : null,
      });
    } catch (logError) {
      console.error("Failed to log check-in:", logError);
    }

    return NextResponse.json({
      success: true,
      registration: {
        ...registration,
        checked_in: true,
        checked_in_at: checkInTime,
      },
      message: "Successfully checked in",
      checkInTime,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.flatten() },
        { status: 400 }
      );
    }

    console.error("Check-in error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET request - fetch check-in status
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
    const registrationId = searchParams.get("registrationId");
    const ticketId = searchParams.get("ticketId");

    if (!registrationId && !ticketId) {
      return NextResponse.json(
        {
          error: "registrationId or ticketId parameter required",
        },
        { status: 400 }
      );
    }

    let query = supabase.from("registrations").select(`
        id,
        ticket_id,
        checked_in,
        checked_in_at,
        check_in_location,
        payment_status,
        user:users(first_name, last_name, email),
        event:events(title, event_date)
      `);

    if (registrationId) {
      query = query.eq("id", registrationId);
    } else {
      query = query.eq("ticket_id", ticketId);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Check-in status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
