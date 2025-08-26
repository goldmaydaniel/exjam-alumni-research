import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  venue: z.string().optional(),
  address: z.string().optional(),
  price: z.number().min(0).optional(),
  capacity: z.number().min(1).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED"]).optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const eventId = params.id;

    // Get event details for editing
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            Registration: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Verify admin access
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check if user is admin or organizer
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (user?.role !== "ADMIN" && user?.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Admin or organizer access required" }, { status: 403 });
    }

    const params = await context.params;
    const eventId = params.id;
    const body = await req.json();
    const validatedData = updateEventSchema.parse(body);

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            Registration: true,
          },
        },
      },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Don't allow capacity reduction below current registrations
    if (validatedData.capacity && validatedData.capacity < existingEvent._count.Registration) {
      return NextResponse.json(
        {
          error: `Cannot reduce capacity below current registrations (${existingEvent._count.Registration})`,
        },
        { status: 400 }
      );
    }

    // Update event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...validatedData,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            Registration: true,
          },
        },
      },
    });

    // If event was cancelled, notify all registered users
    if (validatedData.status === "CANCELLED" && existingEvent.status !== "CANCELLED") {
      // Queue email notifications for cancellation
      const registrations = await prisma.registration.findMany({
        where: { eventId },
        include: { User: true },
      });

      // In production, use a queue service like Bull or AWS SQS
      registrations.forEach(async (registration) => {
        try {
          // Send cancellation email
          console.log(`Sending cancellation email to ${registration.User.email}`);
        } catch (error) {
          console.error(`Failed to send cancellation email:`, error);
        }
      });
    }

    return NextResponse.json({
      success: true,
      event: updatedEvent,
      message: "Event updated successfully",
    });
  } catch (error) {
    console.error("Error updating event:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Verify admin access
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const params = await context.params;
    const eventId = params.id;

    // Check if event has registrations
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            Registration: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event._count.Registration > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete event with ${event._count.Registration} registrations. Cancel the event instead.`,
        },
        { status: 400 }
      );
    }

    // Delete event
    await prisma.event.delete({
      where: { id: eventId },
    });

    return NextResponse.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}

// Clone event endpoint
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Verify admin access
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check if user is admin or organizer
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (user?.role !== "ADMIN" && user?.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Admin or organizer access required" }, { status: 403 });
    }

    const params = await context.params;
    const eventId = params.id;

    // Get original event
    const originalEvent = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!originalEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Create cloned event
    const clonedEvent = await prisma.event.create({
      data: {
        title: `${originalEvent.title} (Copy)`,
        shortDescription: originalEvent.shortDescription,
        description: originalEvent.description,
        startDate: originalEvent.startDate,
        endDate: originalEvent.endDate,
        venue: originalEvent.venue,
        address: originalEvent.address,
        price: originalEvent.price,
        capacity: originalEvent.capacity,
        imageUrl: originalEvent.imageUrl,
        status: "DRAFT", // Always create as draft
        organizerId: decoded.userId,
      },
    });

    return NextResponse.json({
      success: true,
      event: clonedEvent,
      message: "Event cloned successfully",
    });
  } catch (error) {
    console.error("Error cloning event:", error);
    return NextResponse.json({ error: "Failed to clone event" }, { status: 500 });
  }
}
