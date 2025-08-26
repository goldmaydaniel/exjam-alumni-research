import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    const user = await verifyToken(token);

    if (!user || !["ADMIN", "ORGANIZER"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all payments with registration and user details
    const payments = await prisma.payment.findMany({
      include: {
        registration: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
            event: {
              select: {
                title: true,
                startDate: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format the response
    const formattedPayments = payments.map((payment) => ({
      id: payment.id,
      reference: payment.reference,
      amount: payment.amount,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      createdAt: payment.createdAt.toISOString(),
      metadata: payment.metadata,
      registration: {
        id: payment.registration.id,
        ticketType: payment.registration.ticketType,
        user: {
          firstName: payment.registration.user.firstName,
          lastName: payment.registration.user.lastName,
          email: payment.registration.user.email,
          phone: payment.registration.user.phone,
        },
        event: {
          title: payment.registration.event.title,
          startDate: payment.registration.event.startDate.toISOString(),
        },
      },
    }));

    return NextResponse.json(formattedPayments);
  } catch (error) {
    console.error("Admin payments fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}
