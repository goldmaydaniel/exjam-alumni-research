import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateMilitaryService, MilitaryServiceSchema } from "@/lib/military-verification";
import { prisma } from "@/lib/db";
import { validateSession } from "@/lib/auth";

// Request schema for military verification
const VerifyMilitarySchema = z.object({
  userId: z.string().optional(),
  serviceNumber: z.string(),
  squadron: z.string(),
  rank: z.string(),
  serviceYearFrom: z.number(),
  serviceYearTo: z.number().nullable().optional(),
  specialization: z.string().optional(),
  baseLocation: z.string().optional(),
  customSquadron: z.string().optional(),
});

// Admin verification schema
const AdminVerificationSchema = z.object({
  userId: z.string(),
  status: z.enum(["approved", "rejected", "pending"]),
  notes: z.string().optional(),
  verifiedBy: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await validateSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = VerifyMilitarySchema.parse(body);

    // Validate military service data
    const validation = await validateMilitaryService({
      serviceNumber: validatedData.serviceNumber,
      squadron: validatedData.squadron,
      rank: validatedData.rank,
      serviceYearFrom: validatedData.serviceYearFrom,
      serviceYearTo: validatedData.serviceYearTo,
      userId: validatedData.userId || session.user.id,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Check for duplicate service numbers
    const existingUser = await prisma.user.findFirst({
      where: {
        serviceNumber: validatedData.serviceNumber.toUpperCase(),
        id: { not: validatedData.userId || session.user.id },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: "Service number already registered",
          details: { serviceNumber: "This service number is already in use" },
        },
        { status: 400 }
      );
    }

    // Update user military information
    const updatedUser = await prisma.user.update({
      where: { id: validatedData.userId || session.user.id },
      data: {
        serviceNumber: validatedData.serviceNumber.toUpperCase(),
        squadron: validatedData.squadron.toUpperCase(),
        rank: validatedData.rank,
        serviceYearFrom: validatedData.serviceYearFrom,
        serviceYearTo: validatedData.serviceYearTo,
        specialization: validatedData.specialization,
        baseLocation: validatedData.baseLocation,
        verificationStatus: "pending",
        militaryProfileCompleted: true,
        updatedAt: new Date(),
      },
    });

    // Create verification record
    await prisma.militaryVerification.create({
      data: {
        userId: updatedUser.id,
        serviceNumber: validatedData.serviceNumber.toUpperCase(),
        squadron: validatedData.squadron.toUpperCase(),
        rank: validatedData.rank,
        serviceYearFrom: validatedData.serviceYearFrom,
        serviceYearTo: validatedData.serviceYearTo,
        specialization: validatedData.specialization,
        baseLocation: validatedData.baseLocation,
        status: "pending",
        submittedAt: new Date(),
      },
    });

    // Send notification to admins (you would implement this)
    // await sendMilitaryVerificationNotification(updatedUser.id);

    return NextResponse.json({
      message: "Military information updated successfully",
      user: {
        id: updatedUser.id,
        serviceNumber: updatedUser.serviceNumber,
        squadron: updatedUser.squadron,
        verificationStatus: updatedUser.verificationStatus,
      },
    });
  } catch (error) {
    console.error("Military verification error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await validateSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || session.user.id;

    // Get user's military verification status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        serviceNumber: true,
        squadron: true,
        rank: true,
        serviceYearFrom: true,
        serviceYearTo: true,
        specialization: true,
        baseLocation: true,
        verificationStatus: true,
        militaryProfileCompleted: true,
        isVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get verification history
    const verificationHistory = await prisma.militaryVerification.findMany({
      where: { userId },
      orderBy: { submittedAt: "desc" },
      include: {
        verifiedBy: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      user,
      verificationHistory,
    });
  } catch (error) {
    console.error("Get military verification error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// Admin verification endpoint
export async function PATCH(request: NextRequest) {
  try {
    const session = await validateSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, isAdmin: true },
    });

    if (!adminUser?.isAdmin && adminUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = AdminVerificationSchema.parse(body);

    // Update user verification status
    const updatedUser = await prisma.user.update({
      where: { id: validatedData.userId },
      data: {
        verificationStatus: validatedData.status,
        isVerified: validatedData.status === "approved",
        verifiedAt: validatedData.status === "approved" ? new Date() : null,
        verifiedBy: validatedData.status === "approved" ? session.user.id : null,
      },
    });

    // Update verification record
    await prisma.militaryVerification.updateMany({
      where: {
        userId: validatedData.userId,
        status: "pending",
      },
      data: {
        status: validatedData.status,
        verificationNotes: validatedData.notes,
        verifiedById: session.user.id,
        verifiedAt: new Date(),
      },
    });

    // Send notification to user (implement this)
    // await sendVerificationStatusNotification(validatedData.userId, validatedData.status);

    return NextResponse.json({
      message: `Military service ${validatedData.status} successfully`,
      user: {
        id: updatedUser.id,
        verificationStatus: updatedUser.verificationStatus,
        isVerified: updatedUser.isVerified,
      },
    });
  } catch (error) {
    console.error("Admin military verification error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
