import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { paystackService } from "@/lib/payment/paystack";
import { sendEmail, getPaymentConfirmationTemplate } from "@/lib/email";
import { generateBadgeForRegistration } from "@/lib/badge-auto-generator";
import { generateQRCode } from "@/lib/qr-generator";

// Helper function to generate ticket number
function generateTicketNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TKT-${timestamp}-${random}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json({ success: false, error: "Reference is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify payment with Paystack
    const verification = await paystackService.verifyPayment(reference);

    if (verification.data?.status === "success") {
      // Find registration by payment reference
      const { data: registration, error: regError } = await supabase
        .from("Registration")
        .select(
          `
          id,
          userId,
          eventId,
          ticketType,
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
            startDate,
            endDate,
            venue,
            address,
            description,
            imageUrl
          )
        `
        )
        .eq("paymentReference", reference)
        .single();

      if (regError || !registration) {
        throw new Error("Registration not found for payment reference");
      }

      // Update registration status to confirmed
      const { error: updateError } = await supabase
        .from("Registration")
        .update({
          status: "CONFIRMED",
          updatedAt: new Date().toISOString(),
        })
        .eq("id", registration.id);

      if (updateError) {
        throw new Error("Failed to update registration status");
      }

      // Generate ticket with QR code
      const ticketNumber = generateTicketNumber();

      // Generate QR code with ticket data using new QR generator
      const qrCodeDataUrl = await generateQRCode(
        {
          ticketId: ticketNumber,
          eventId: registration.eventId,
          userId: registration.userId,
          email: registration.user.email,
          registrationDate: new Date().toISOString(),
          type: "ticket",
        },
        {
          width: 200,
          errorCorrectionLevel: "M",
        }
      );

      // Create ticket record
      const { data: ticket, error: ticketError } = await supabase
        .from("Ticket")
        .insert({
          id: crypto.randomUUID(),
          registrationId: registration.id,
          userId: registration.userId,
          eventId: registration.eventId,
          ticketNumber,
          qrCode: qrCodeDataUrl,
          checkedIn: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (ticketError || !ticket) {
        throw new Error("Failed to create ticket");
      }

      // Auto-generate badge for confirmed registration
      try {
        await generateBadgeForRegistration({
          registrationId: registration.id,
          userId: registration.userId,
          eventId: registration.eventId,
          ticketNumber: ticket.ticketNumber,
        });
      } catch (badgeError) {
        console.error("Failed to auto-generate badge:", badgeError);
        // Don't fail the payment verification if badge generation fails
      }

      // Send professional payment confirmation email with ticket
      try {
        const paymentDetails = {
          amount: verification.data.amount / 100, // Convert from kobo
          currency: "NGN",
          reference: verification.data.reference,
          paymentMethod: verification.data.channel || "Card",
          date: new Date(verification.data.paid_at).toLocaleDateString("en-NG", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        };

        const registrationDetails = {
          name:
            registration.user.fullName ||
            `${registration.user.firstName} ${registration.user.lastName}`,
          email: registration.user.email,
          ticketNumber: ticket.ticketNumber,
          ticketType: registration.ticketType || "REGULAR",
          qrCodeUrl: ticket.qrCode,
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
          payment: paymentDetails,
        };

        const paymentConfirmationHtml = getPaymentConfirmationTemplate(registrationDetails);

        await sendEmail({
          to: registration.user.email,
          subject: "Payment Confirmed - Your ExJAM Association Conference Ticket",
          html: paymentConfirmationHtml,
        });
      } catch (emailError) {
        console.error("Failed to send payment confirmation email:", emailError);
      }

      return NextResponse.redirect(
        new URL(`/dashboard?payment=success&ticket=${ticket.ticketNumber}`, req.url)
      );
    } else {
      // Mark registration as payment failed
      await supabase
        .from("Registration")
        .update({
          status: "PAYMENT_FAILED",
          updatedAt: new Date().toISOString(),
        })
        .eq("paymentReference", reference);

      return NextResponse.redirect(new URL("/dashboard?payment=failed", req.url));
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.redirect(new URL("/dashboard?payment=error", req.url));
  }
}
