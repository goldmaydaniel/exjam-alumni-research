import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  sendEmail,
  getRegistrationConfirmationTemplate,
  getPaymentConfirmationTemplate,
} from "@/lib/email";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const supabase = await createClient();

    // Get registration with all related data
    const { data: registration, error: registrationError } = await supabase
      .from("Registration")
      .select(
        `
        id,
        userId,
        eventId,
        ticketType,
        status,
        paymentReference,
        user:User!userId(
          id,
          email,
          firstName,
          lastName,
          fullName
        ),
        event:Event!eventId(
          id,
          title,
          description,
          startDate,
          endDate,
          venue,
          address,
          imageUrl
        ),
        ticket:Ticket(
          id,
          ticketNumber,
          qrCode
        )
      `
      )
      .eq("id", id)
      .single();

    if (registrationError || !registration) {
      return NextResponse.json(
        { success: false, error: "Registration not found" },
        { status: 404 }
      );
    }

    // Prepare email data based on registration status
    let emailHtml: string;
    let subject: string;

    if (registration.status === "CONFIRMED" && registration.ticket) {
      // Send payment confirmation email with ticket
      const registrationDetails = {
        name:
          registration.user.fullName ||
          `${registration.user.firstName} ${registration.user.lastName}`,
        email: registration.user.email,
        ticketNumber: registration.ticket.ticketNumber,
        ticketType: registration.ticketType || "REGULAR",
        qrCodeUrl: registration.ticket.qrCode,
        eventDetails: {
          title: registration.event.title,
          date: new Date(registration.event.startDate).toLocaleDateString("en-NG", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          time: new Date(registration.event.startDate).toLocaleTimeString("en-NG", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          venue: registration.event.venue,
          address: registration.event.address || "Address to be confirmed",
          description: registration.event.description || undefined,
          imageUrl: registration.event.imageUrl || undefined,
        },
        payment: {
          amount: 0, // Will need to get from ticket pricing
          currency: "NGN",
          reference: registration.paymentReference || "",
          paymentMethod: "Card",
          date: new Date().toLocaleDateString("en-NG", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        },
      };

      emailHtml = getPaymentConfirmationTemplate(registrationDetails);
      subject = "Your ExJAM Association Conference Ticket - Confirmation Resent";
    } else {
      // Send registration confirmation email
      const registrationDetails = {
        name:
          registration.user.fullName ||
          `${registration.user.firstName} ${registration.user.lastName}`,
        email: registration.user.email,
        eventTitle: registration.event.title,
        eventDate: new Date(registration.event.startDate).toLocaleDateString("en-NG", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        eventVenue: registration.event.venue,
        registrationId: registration.id,
      };

      emailHtml = getRegistrationConfirmationTemplate(registrationDetails);
      subject = "Your ExJAM Association Conference Registration - Confirmation Resent";
    }

    // Send the email
    await sendEmail({
      to: registration.user.email,
      subject,
      html: emailHtml,
    });

    return NextResponse.json({
      success: true,
      message: "Confirmation email resent successfully",
    });
  } catch (error) {
    console.error("Error resending confirmation email:", error);
    return NextResponse.json(
      { success: false, error: "Failed to resend confirmation email" },
      { status: 500 }
    );
  }
}
