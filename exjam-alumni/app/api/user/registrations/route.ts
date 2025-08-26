import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // Get user from token
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = verifyToken(token);

    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get user's registrations with related data
    const registrations = await prisma.registration.findMany({
      where: {
        userId: userId,
      },
      include: {
        Event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            venue: true,
            price: true,
            status: true,
          },
        },
        Payment: {
          select: {
            status: true,
            amount: true,
            createdAt: true,
            reference: true,
          },
        },
        Ticket: {
          select: {
            ticketNumber: true,
            qrCode: true,
            checkedIn: true,
            checkedInAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(registrations);
  } catch (error) {
    console.error("Error fetching user registrations:", error);
    return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 });
  }
}
