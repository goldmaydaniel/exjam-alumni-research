import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: registrationId } = params;
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get registration details
    const { data: registration, error: fetchError } = await supabase
      .from("Registration")
      .select(
        `
        *,
        Event(title, startDate),
        Payment(id, status, amount)
      `
      )
      .eq("id", registrationId)
      .single();

    if (fetchError || !registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    // Check if user owns this registration or is admin
    const { data: dbUser } = await supabase.from("User").select("role").eq("id", user.id).single();

    const isOwner = registration.userId === user.id;
    const isAdmin = dbUser?.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if registration can be cancelled
    if (registration.status === "CANCELLED") {
      return NextResponse.json({ error: "Registration is already cancelled" }, { status: 400 });
    }

    const eventStartDate = new Date(registration.Event.startDate);
    const now = new Date();
    const hoursUntilEvent = (eventStartDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Allow cancellation up to 24 hours before event
    if (hoursUntilEvent < 24) {
      return NextResponse.json(
        { error: "Cannot cancel registration less than 24 hours before event" },
        { status: 400 }
      );
    }

    // Update registration status
    const { error: updateError } = await supabase
      .from("Registration")
      .update({
        status: "CANCELLED",
        updatedAt: new Date().toISOString(),
      })
      .eq("id", registrationId);

    if (updateError) throw updateError;

    // If there's a payment, mark it for refund
    if (registration.Payment && registration.Payment.status === "SUCCESS") {
      await supabase
        .from("Payment")
        .update({
          status: "REFUNDED",
          updatedAt: new Date().toISOString(),
          metadata: {
            ...registration.Payment.metadata,
            refundReason: "Registration cancelled",
            refundDate: new Date().toISOString(),
          },
        })
        .eq("id", registration.Payment.id);
    }

    // Create audit log
    await supabase.from("AuditLog").insert({
      userId: user.id,
      action: "CANCEL_REGISTRATION",
      entity: "Registration",
      entityId: registrationId,
      changes: {
        from: registration.status,
        to: "CANCELLED",
        reason: "User initiated cancellation",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Registration cancelled successfully",
      refundEligible: registration.Payment?.status === "SUCCESS",
    });
  } catch (error) {
    console.error("Cancel registration error:", error);
    return NextResponse.json({ error: "Failed to cancel registration" }, { status: 500 });
  }
}
