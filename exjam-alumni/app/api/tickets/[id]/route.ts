import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { generateTicketNumber, generateTicketQR } from "@/lib/ticket";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Get authenticated user from Supabase
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get registration with related data using Supabase
    const { data: registration, error: regError } = await supabase
      .from("Registration")
      .select(
        `
        id,
        userId,
        eventId,
        status,
        Event (
          id,
          title,
          startDate,
          venue
        ),
        User (
          id,
          firstName,
          lastName
        ),
        Payment (
          status
        ),
        Ticket (
          id,
          ticketNumber,
          qrCode
        )
      `
      )
      .eq("id", id)
      .single();

    if (regError || !registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    // Verify ownership
    if (registration.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if ticket already exists
    if (registration.Ticket) {
      return NextResponse.json(registration.Ticket);
    }

    // Verify payment is complete
    if (registration.Payment?.status !== "SUCCESS") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    // Generate ticket
    const ticketNumber = await generateTicketNumber();
    const qrCode = await generateTicketQR({
      ticketNumber,
      eventId: registration.Event.id,
      userId: registration.User.id,
      eventTitle: registration.Event.title,
      userName: `${registration.User.firstName} ${registration.User.lastName}`,
      eventDate: registration.Event.startDate,
      venue: registration.Event.venue,
    });

    // Create ticket using Supabase
    const { data: ticket, error: ticketError } = await supabase
      .from("Ticket")
      .insert({
        id: crypto.randomUUID(),
        registrationId: registration.id,
        userId: registration.userId,
        eventId: registration.eventId,
        ticketNumber,
        qrCode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (ticketError) {
      console.error("Ticket creation error:", ticketError);
      return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
    }

    // Update registration status using Supabase
    const { error: updateError } = await supabase
      .from("Registration")
      .update({ status: "CONFIRMED" })
      .eq("id", registration.id);

    if (updateError) {
      console.error("Registration update error:", updateError);
      // Still return the ticket since it was created successfully
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Ticket generation error:", error);
    return NextResponse.json({ error: "Failed to generate ticket" }, { status: 500 });
  }
}
