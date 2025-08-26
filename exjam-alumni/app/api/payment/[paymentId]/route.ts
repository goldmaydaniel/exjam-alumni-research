import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: { paymentId: string } }) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    const user = await verifyToken(token);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paymentId } = params;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        registration: {
          include: {
            event: true,
            user: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Check if user owns this payment or is admin
    if (payment.userId !== user.userId && !["ADMIN", "ORGANIZER"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      id: payment.id,
      reference: payment.reference,
      amount: payment.amount,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      registration: {
        id: payment.registration.id,
        ticketType: payment.registration.ticketType,
        event: {
          id: payment.registration.event.id,
          title: payment.registration.event.title,
          startDate: payment.registration.event.startDate.toISOString(),
          endDate: payment.registration.event.endDate.toISOString(),
          venue: payment.registration.event.venue,
          price: payment.registration.event.price,
        },
        user: {
          firstName: payment.registration.user.firstName,
          lastName: payment.registration.user.lastName,
          email: payment.registration.user.email,
          phone: payment.registration.user.phone,
        },
      },
    });
  } catch (error) {
    console.error("Payment fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch payment" }, { status: 500 });
  }
}
