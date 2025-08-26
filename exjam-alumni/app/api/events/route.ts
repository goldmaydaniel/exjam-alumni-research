import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import crypto from "crypto";

const eventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  venue: z.string().min(1),
  address: z.string().optional(),
  capacity: z.number().int().positive(),
  price: z.number().nonnegative(),
  imageUrl: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED"]).default("DRAFT"),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const showPast = searchParams.get("showPast") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause
    let where: any = {};

    // Apply status filter
    if (!status) {
      // Show published and completed events for public access
      where.status = { in: ["PUBLISHED", "COMPLETED"] };
    } else if (status !== "ALL") {
      where.status = status;
    }

    // By default, show only future events unless showPast is true
    if (!showPast) {
      where.endDate = { gte: new Date() };
    }

    // Search functionality
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { venue: { contains: search, mode: "insensitive" } },
      ];
    }

    // Price filtering
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    // Date filtering
    if (startDate || endDate) {
      if (!where.startDate) where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate);
      if (endDate) where.startDate.lte = new Date(endDate);
    }

    // Get events
    const events = await prisma.event.findMany({
      where,
      orderBy: { startDate: "asc" },
      skip: offset,
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        shortDescription: true,
        startDate: true,
        endDate: true,
        venue: true,
        address: true,
        capacity: true,
        price: true,
        earlyBirdPrice: true,
        earlyBirdDeadline: true,
        imageUrl: true,
        status: true,
        tags: true,
        createdAt: true,
        organizerId: true,
      },
    });

    // Get total count
    const total = await prisma.event.count({ where });

    // For each event, get registration count and ensure numeric types
    const eventsWithCounts = events.map((event) => ({
      ...event,
      price: Number(event.price),
      earlyBirdPrice: event.earlyBirdPrice ? Number(event.earlyBirdPrice) : null,
      capacity: Number(event.capacity),
      registrationCount: 0, // TODO: Add registration count when needed
      availableSpots: Number(event.capacity),
    }));

    return NextResponse.json({
      events: eventsWithCounts,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Events API error:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = eventSchema.parse(body);

    // Create event using Prisma
    const event = await prisma.event.create({
      data: {
        id: crypto.randomUUID(),
        title: validatedData.title,
        description: validatedData.description,
        shortDescription: validatedData.shortDescription,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        venue: validatedData.venue,
        address: validatedData.address,
        capacity: validatedData.capacity,
        price: validatedData.price,
        imageUrl: validatedData.imageUrl,
        status: validatedData.status,
        organizerId: null, // For now, allow anonymous event creation for testing
        tags: [], // Default empty tags
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        title: true,
        description: true,
        shortDescription: true,
        startDate: true,
        endDate: true,
        venue: true,
        address: true,
        capacity: true,
        price: true,
        earlyBirdPrice: true,
        earlyBirdDeadline: true,
        imageUrl: true,
        status: true,
        tags: true,
        createdAt: true,
        organizerId: true,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.flatten() },
        { status: 400 }
      );
    }

    console.error("Event creation error:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
