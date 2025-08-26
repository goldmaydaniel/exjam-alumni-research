import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const registrationSchema = z.object({
  eventId: z.string(),
  ticketType: z.enum(["REGULAR", "VIP", "STUDENT"]),
  specialRequests: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = registrationSchema.parse(body);

    // Check if event exists and has capacity
    const { data: event, error: eventError } = await supabase
      .from("Event")
      .select(
        `
        id,
        title,
        price,
        capacity,
        status,
        startDate,
        endDate,
        venue
      `
      )
      .eq("id", validatedData.eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check current registration count
    const { count: registrationCount, error: countError } = await supabase
      .from("Registration")
      .select("*", { count: "exact", head: true })
      .eq("eventId", validatedData.eventId)
      .neq("status", "CANCELLED");

    if (countError) {
      return NextResponse.json({ error: "Error checking event capacity" }, { status: 500 });
    }

    if ((registrationCount || 0) >= event.capacity) {
      return NextResponse.json({ error: "Event is fully booked" }, { status: 400 });
    }

    // Check if user already registered
    const { data: existingRegistration, error: existingError } = await supabase
      .from("Registration")
      .select("id")
      .eq("userId", user.id)
      .eq("eventId", validatedData.eventId)
      .neq("status", "CANCELLED")
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: "Error checking existing registration" }, { status: 500 });
    }

    if (existingRegistration) {
      return NextResponse.json(
        { error: "You have already registered for this event" },
        { status: 400 }
      );
    }

    // Generate unique registration ID and payment reference
    const registrationId = crypto.randomUUID();
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const pgconReference = `PGCON25-${timestamp}-${randomSuffix}`;

    // Create registration using Supabase client
    const { data: registration, error: regError } = await supabase
      .from("Registration")
      .insert({
        id: registrationId,
        userId: user.id,
        eventId: validatedData.eventId,
        ticketType: validatedData.ticketType,
        specialRequests: validatedData.specialRequests || null,
        status: "PENDING",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (regError) {
      console.error("Registration creation error:", regError);
      return NextResponse.json({ error: "Failed to create registration" }, { status: 500 });
    }

    // Create payment record using Supabase client
    const { data: payment, error: payError } = await supabase
      .from("Payment")
      .insert({
        id: crypto.randomUUID(),
        registrationId: registration.id,
        userId: user.id,
        amount: event.price,
        currency: "NGN",
        provider: "paystack",
        reference: pgconReference,
        status: "PENDING",
        metadata: { paymentMethod: "PENDING_SELECTION" },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (payError) {
      console.error("Payment creation error:", payError);
      // Try to cleanup registration if payment creation failed
      await supabase.from("Registration").delete().eq("id", registration.id);
      return NextResponse.json({ error: "Failed to create payment record" }, { status: 500 });
    }

    return NextResponse.json({
      registration,
      payment,
      paymentUrl: `/api/payments/initialize/${payment.id}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.flatten() },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json({ error: "Failed to create registration" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch registrations with related data using Supabase
    const { data: registrations, error: regError } = await supabase
      .from("Registration")
      .select(
        `
        id,
        ticketType,
        status,
        createdAt,
        Event (
          id,
          title,
          startDate,
          venue
        ),
        Payment (
          amount,
          status
        ),
        Ticket (
          ticketNumber,
          qrCode
        )
      `
      )
      .eq("userId", user.id)
      .order("createdAt", { ascending: false });

    if (regError) {
      console.error("Fetch registrations error:", regError);
      return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 });
    }

    // Transform the data to match the expected format
    const formattedRegistrations =
      registrations?.map((reg) => ({
        id: reg.id,
        ticketType: reg.ticketType,
        status: reg.status,
        createdAt: reg.createdAt,
        event: reg.Event
          ? {
              id: reg.Event.id,
              title: reg.Event.title,
              startDate: reg.Event.startDate,
              venue: reg.Event.venue,
            }
          : null,
        payment: reg.Payment
          ? {
              amount: reg.Payment.amount,
              status: reg.Payment.status,
            }
          : null,
        ticket: reg.Ticket
          ? {
              ticketNumber: reg.Ticket.ticketNumber,
              qrCode: reg.Ticket.qrCode,
            }
          : null,
      })) || [];

    return NextResponse.json(formattedRegistrations);
  } catch (error) {
    console.error("Fetch registrations error:", error);
    return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 });
  }
}
