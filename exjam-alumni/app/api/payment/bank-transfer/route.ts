import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    const user = await verifyToken(token);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paymentId, bankDetails } = await request.json();

    // Verify payment exists and belongs to user
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

    if (!payment || payment.userId !== user.userId) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Update payment to bank transfer pending
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "BANK_TRANSFER_PENDING",
        paymentMethod: "BANK_TRANSFER",
        metadata: {
          bankDetails,
          pendingSince: new Date().toISOString(),
        },
      },
    });

    // Update registration status
    await prisma.registration.update({
      where: { id: payment.registrationId },
      data: {
        status: "PAYMENT_PENDING",
      },
    });

    // Generate temporary badge/ticket
    let ticket = await prisma.ticket.findFirst({
      where: { registrationId: payment.registrationId },
    });

    if (!ticket) {
      const ticketNumber = `${payment.reference}-TEMP`;

      ticket = await prisma.ticket.create({
        data: {
          id: crypto.randomUUID(),
          registrationId: payment.registrationId,
          userId: payment.userId,
          eventId: payment.registration.event.id,
          ticketNumber,
          qrCode: `temp-qr-${payment.id}`,
          status: "TEMPORARY",
          isTemporary: true,
          checkedIn: false,
        },
      });
    }

    // TODO: Send email with bank details and temporary badge

    return NextResponse.json({
      success: true,
      message: "Bank transfer instructions generated",
      temporaryTicketId: ticket.id,
      paymentReference: payment.reference,
    });
  } catch (error) {
    console.error("Bank transfer error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process bank transfer" },
      { status: 500 }
    );
  }
}
