import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { paymentId: string } }) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    const user = await verifyToken(token);

    if (!user || !["ADMIN", "ORGANIZER"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paymentId } = params;
    const { approved, notes } = await request.json();

    // Get payment with registration details
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
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

    if (approved) {
      // Approve the payment
      await prisma.$transaction(async (tx) => {
        // Update payment status
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            verifiedBy: user.userId,
            verificationNotes: notes,
            metadata: {
              ...payment.metadata,
              verifiedAt: new Date().toISOString(),
              verifiedBy: user.userId,
              verificationNotes: notes,
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

        // Generate official ticket if it doesn't exist or replace temporary one
        const ticket = await tx.ticket.findFirst({
          where: { registrationId: payment.registrationId },
        });

        const officialTicketNumber = payment.reference.replace("-TEMP", "");

        if (ticket && ticket.isTemporary) {
          // Update temporary ticket to official
          await tx.ticket.update({
            where: { id: ticket.id },
            data: {
              ticketNumber: officialTicketNumber,
              qrCode: `qr-${payment.id}-official`,
              status: "ACTIVE",
              isTemporary: false,
              activatedAt: new Date(),
            },
          });
        } else if (!ticket) {
          // Create new official ticket
          await tx.ticket.create({
            data: {
              id: crypto.randomUUID(),
              registrationId: payment.registrationId,
              userId: payment.userId,
              eventId: payment.registration.event.id,
              ticketNumber: officialTicketNumber,
              qrCode: `qr-${payment.id}-official`,
              status: "ACTIVE",
              isTemporary: false,
              checkedIn: false,
              activatedAt: new Date(),
            },
          });
        }
      });

      // TODO: Send confirmation email to user with official badge

      return NextResponse.json({
        success: true,
        message: "Payment verified and official badge generated",
      });
    } else {
      // Reject the payment
      await prisma.$transaction(async (tx) => {
        // Update payment status
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: "FAILED",
            verifiedBy: user.userId,
            verificationNotes: notes,
            metadata: {
              ...payment.metadata,
              rejectedAt: new Date().toISOString(),
              rejectedBy: user.userId,
              rejectionReason: notes,
            },
          },
        });

        // Update registration status
        await tx.registration.update({
          where: { id: payment.registrationId },
          data: {
            status: "PAYMENT_FAILED",
          },
        });

        // Remove temporary ticket if exists
        await tx.ticket.deleteMany({
          where: {
            registrationId: payment.registrationId,
            isTemporary: true,
          },
        });
      });

      // TODO: Send rejection email to user with reason

      return NextResponse.json({
        success: true,
        message: "Payment rejected",
      });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
  }
}
