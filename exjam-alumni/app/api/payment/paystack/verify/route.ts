import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json({ error: "Payment reference required" }, { status: 400 });
    }

    // Verify payment with Paystack
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await paystackResponse.json();

    if (!data.status) {
      return NextResponse.json(
        { success: false, error: "Payment verification failed" },
        { status: 400 }
      );
    }

    const transaction = data.data;

    // Find payment record
    const payment = await prisma.payment.findFirst({
      where: { reference },
      include: {
        registration: {
          include: {
            user: true,
            event: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Check if payment is successful
    if (transaction.status === "success") {
      await prisma.$transaction(async (tx) => {
        // Update payment status
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "COMPLETED",
            paymentMethod: "PAYSTACK",
            completedAt: new Date(),
            metadata: {
              ...payment.metadata,
              paystackTransactionId: transaction.id,
              paystackReference: transaction.reference,
              verifiedAt: new Date().toISOString(),
              amount: transaction.amount,
              currency: transaction.currency,
            },
          },
        });

        // Update registration status
        await tx.registration.update({
          where: { id: payment.registrationId },
          data: {
            status: "CONFIRMED",
          },
        });

        // Generate official ticket
        const existingTicket = await tx.ticket.findFirst({
          where: { registrationId: payment.registrationId },
        });

        if (existingTicket && existingTicket.isTemporary) {
          // Update temporary ticket to official
          await tx.ticket.update({
            where: { id: existingTicket.id },
            data: {
              ticketNumber: payment.reference,
              qrCode: `qr-${payment.id}-official`,
              status: "ACTIVE",
              isTemporary: false,
              activatedAt: new Date(),
            },
          });
        } else if (!existingTicket) {
          // Create new official ticket
          await tx.ticket.create({
            data: {
              id: crypto.randomUUID(),
              registrationId: payment.registrationId,
              userId: payment.userId,
              eventId: payment.registration.event.id,
              ticketNumber: payment.reference,
              qrCode: `qr-${payment.id}-official`,
              status: "ACTIVE",
              isTemporary: false,
              checkedIn: false,
              activatedAt: new Date(),
            },
          });
        }
      });

      // Redirect to badge page
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/badge/${payment.registrationId}?payment=success`
      );
    } else {
      // Payment failed or cancelled
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          metadata: {
            ...payment.metadata,
            paystackTransactionId: transaction.id,
            paystackReference: transaction.reference,
            failureReason: transaction.gateway_response || "Payment failed",
          },
        },
      });

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/payment/${payment.id}?status=failed`
      );
    }
  } catch (error) {
    console.error("Paystack verification error:", error);
    return NextResponse.json(
      { success: false, error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
