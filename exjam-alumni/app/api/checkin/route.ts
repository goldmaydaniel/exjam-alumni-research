import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const checkinSchema = z.object({
  ticketNumber: z.string(),
  eventId: z.string().optional(),
});

async function requireOrganizer(supabase: any) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized", status: 401 };
  }

  // Check user role
  const { data: userData, error: userError } = await supabase
    .from("User")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userError || !userData) {
    return { error: "User not found", status: 404 };
  }

  const allowedRoles = ["ADMIN", "ORGANIZER", "SPEAKER"];
  if (!allowedRoles.includes(userData.role)) {
    return { error: "Organizer access required", status: 403 };
  }

  return { user: { ...user, role: userData.role } };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify organizer access
    const authResult = await requireOrganizer(supabase);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const { ticketNumber, eventId } = checkinSchema.parse(body);

    // Find the ticket using Supabase
    const { data: ticket, error: ticketError } = await supabase
      .from("Ticket")
      .select(
        `
        id,
        ticketNumber,
        eventId,
        checkedIn,
        checkedInAt,
        User (
          firstName,
          lastName,
          email
        ),
        Event (
          id,
          title,
          startDate,
          endDate
        ),
        Registration (
          ticketType,
          specialRequests
        )
      `
      )
      .eq("ticketNumber", ticketNumber)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Verify event if specified
    if (eventId && ticket.eventId !== eventId) {
      return NextResponse.json({ error: "Ticket is not valid for this event" }, { status: 400 });
    }

    // Check if already checked in
    if (ticket.checkedIn) {
      return NextResponse.json({
        warning: "Already checked in",
        checkedInAt: ticket.checkedInAt,
        ticket,
      });
    }

    // Update check-in status using Supabase
    const { data: updatedTicket, error: updateError } = await supabase
      .from("Ticket")
      .update({
        checkedIn: true,
        checkedInAt: new Date().toISOString(),
      })
      .eq("id", ticket.id)
      .select()
      .single();

    if (updateError) {
      console.error("Check-in update error:", updateError);
      return NextResponse.json({ error: "Failed to update check-in status" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Check-in successful",
      ticket: {
        ...ticket,
        ...updatedTicket,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.flatten() },
        { status: 400 }
      );
    }

    console.error("Check-in error:", error);
    return NextResponse.json({ error: "Check-in failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const authResult = await requireOrganizer(supabase);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const searchParams = req.nextUrl.searchParams;
    const eventId = searchParams.get("eventId");
    const date = searchParams.get("date");

    // Build Supabase query
    let query = supabase
      .from("Ticket")
      .select(
        `
        id,
        ticketNumber,
        checkedInAt,
        User (
          firstName,
          lastName,
          email
        ),
        Event (
          title
        )
      `
      )
      .eq("checkedIn", true)
      .order("checkedInAt", { ascending: false });

    if (eventId) {
      query = query.eq("eventId", eventId);
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      query = query
        .gte("checkedInAt", startDate.toISOString())
        .lte("checkedInAt", endDate.toISOString());
    }

    const { data: checkins, error: checkinsError } = await query;

    if (checkinsError) {
      console.error("Fetch check-ins error:", checkinsError);
      return NextResponse.json({ error: "Failed to fetch check-ins" }, { status: 500 });
    }

    return NextResponse.json(checkins || []);
  } catch (error) {
    console.error("Fetch check-ins error:", error);
    return NextResponse.json({ error: "Failed to fetch check-ins" }, { status: 500 });
  }
}
