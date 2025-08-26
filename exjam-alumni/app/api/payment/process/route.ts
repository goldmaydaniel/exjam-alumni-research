import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import QRCode from "qrcode";

const paymentSchema = z.object({
  paymentId: z.string(),
  provider: z.enum(["paystack", "stripe", "flutterwave"]).default("paystack"),
  reference: z.string(),
});

async function generateQRCode(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      width: 400,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
  } catch (error) {
    console.error("QR Code generation error:", error);
    return "";
  }
}

function generateTicketNumber(eventId: string, registrationId: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${eventId.substring(0, 4).toUpperCase()}-${timestamp}-${random}`;
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const { paymentId, provider, reference } = paymentSchema.parse(body);

    // Get payment with registration details
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        Registration: {
          include: {
            Event: true,
            User: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.userId !== decoded.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (payment.status === "SUCCESS") {
      return NextResponse.json({ error: "Payment already processed" }, { status: 400 });
    }

    // In production, verify payment with provider API
    // For now, we'll simulate successful payment
    const paymentVerified = true;

    if (!paymentVerified) {
      // Update payment as failed
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "FAILED",
          updatedAt: new Date(),
          metadata: {
            failedAt: new Date().toISOString(),
            reason: "Payment verification failed",
          },
        },
      });

      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    // Generate ticket data
    const ticketNumber = generateTicketNumber(payment.Registration.eventId, payment.registrationId);

    const ticketData = {
      ticketNumber,
      eventId: payment.Registration.eventId,
      registrationId: payment.registrationId,
      userId: payment.userId,
      eventTitle: payment.Registration.Event.title,
      userName: `${payment.Registration.User.firstName} ${payment.Registration.User.lastName}`,
      eventDate: payment.Registration.Event.startDate.toISOString(),
      venue: payment.Registration.Event.venue,
    };

    const qrCode = await generateQRCode(JSON.stringify(ticketData));

    // Start transaction to update payment, registration, and create ticket
    const result = await prisma.$transaction(async (tx) => {
      // Update payment status
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: "SUCCESS",
          reference,
          updatedAt: new Date(),
          metadata: {
            provider,
            reference,
            paidAt: new Date().toISOString(),
          },
        },
      });

      // Update registration status
      const updatedRegistration = await tx.registration.update({
        where: { id: payment.registrationId },
        data: {
          status: "CONFIRMED",
          updatedAt: new Date(),
        },
      });

      // Create ticket
      const ticket = await tx.ticket.create({
        data: {
          id: crypto.randomUUID(),
          registrationId: payment.registrationId,
          userId: payment.userId,
          eventId: payment.Registration.eventId,
          ticketNumber,
          qrCode,
          checkedIn: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return {
        payment: updatedPayment,
        registration: updatedRegistration,
        ticket,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Payment processed successfully",
      data: {
        payment: result.payment,
        registration: result.registration,
        ticket: {
          id: result.ticket.id,
          ticketNumber: result.ticket.ticketNumber,
          qrCode: result.ticket.qrCode,
          eventDetails: {
            title: payment.Registration.Event.title,
            startDate: payment.Registration.Event.startDate,
            endDate: payment.Registration.Event.endDate,
            venue: payment.Registration.Event.venue,
            address: payment.Registration.Event.address,
          },
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.flatten() },
        { status: 400 }
      );
    }

    console.error("Payment processing error:", error);
    return NextResponse.json({ error: "Failed to process payment" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const payments = await prisma.payment.findMany({
      where: { userId: decoded.userId },
      include: {
        Registration: {
          include: {
            Event: {
              select: {
                title: true,
                startDate: true,
                venue: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Fetch payments error:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}
