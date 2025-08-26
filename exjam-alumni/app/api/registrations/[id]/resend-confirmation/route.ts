import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

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

    // Get registration details with related data
    const { data: registration, error: fetchError } = await supabase
      .from("Registration")
      .select(
        `
        *,
        Event(
          id, title, description, startDate, endDate, 
          venue, address
        ),
        User(
          id, firstName, lastName, email
        ),
        Payment(
          id, status, amount, reference
        ),
        Ticket(
          id, ticketNumber, qrCode
        )
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

    // Check if registration is confirmed
    if (registration.status !== "CONFIRMED") {
      return NextResponse.json(
        { error: "Registration must be confirmed to resend confirmation" },
        { status: 400 }
      );
    }

    // Send confirmation email
    const emailData = {
      to: registration.User.email,
      subject: `Registration Confirmation - ${registration.Event.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Registration Confirmed!</h2>
          <p>Dear ${registration.User.firstName},</p>
          
          <p>Your registration for <strong>${registration.Event.title}</strong> has been confirmed.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Event Details</h3>
            <p><strong>Event:</strong> ${registration.Event.title}</p>
            <p><strong>Date:</strong> ${new Date(registration.Event.startDate).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${new Date(registration.Event.startDate).toLocaleTimeString()}</p>
            <p><strong>Venue:</strong> ${registration.Event.venue}</p>
            ${registration.Event.address ? `<p><strong>Address:</strong> ${registration.Event.address}</p>` : ""}
          </div>
          
          ${
            registration.Ticket
              ? `
            <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Your Ticket</h3>
              <p><strong>Ticket Number:</strong> ${registration.Ticket.ticketNumber}</p>
              <p>Please bring this confirmation or save your ticket for entry.</p>
            </div>
          `
              : ""
          }
          
          ${
            registration.Payment && registration.Payment.status === "SUCCESS"
              ? `
            <div style="background: #f0f8f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Payment Confirmation</h3>
              <p><strong>Amount:</strong> ₦${registration.Payment.amount}</p>
              <p><strong>Reference:</strong> ${registration.Payment.reference}</p>
              <p><strong>Status:</strong> Paid</p>
            </div>
          `
              : ""
          }
          
          <p>If you have any questions, please don't hesitate to contact us.</p>
          
          <p>Best regards,<br>The ExJAM Association</p>
        </div>
      `,
    };

    await sendEmail(emailData);

    // Create audit log
    await supabase.from("AuditLog").insert({
      userId: user.id,
      action: "RESEND_CONFIRMATION",
      entity: "Registration",
      entityId: registrationId,
      changes: {
        email: registration.User.email,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Confirmation email resent successfully",
    });
  } catch (error) {
    console.error("Resend confirmation error:", error);
    return NextResponse.json({ error: "Failed to resend confirmation email" }, { status: 500 });
  }
}
