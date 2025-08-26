import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const syncUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  serviceNumber: z.string().optional(),
  squadron: z.enum(["ALPHA", "JAGUAR", "MIG", "HERCULES", "DONIER"]).optional(),
  graduationYear: z.string().optional(),
  chapter: z.string().optional(),
  currentLocation: z.string().optional(),
  currentOccupation: z.string().optional(),
  company: z.string().optional(),
  role: z.enum(["ATTENDEE", "SPEAKER", "ORGANIZER", "ADMIN"]).default("ATTENDEE"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = syncUserSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: validatedData.id },
    });

    if (existingUser) {
      // Update existing user
      const updatedUser = await prisma.user.update({
        where: { id: validatedData.id },
        data: {
          email: validatedData.email,
          firstName: validatedData.firstName || existingUser.firstName,
          lastName: validatedData.lastName || existingUser.lastName,
          phone: validatedData.phone || existingUser.phone,
          serviceNumber: validatedData.serviceNumber || existingUser.serviceNumber,
          squadron: validatedData.squadron || existingUser.squadron,
          graduationYear: validatedData.graduationYear || existingUser.graduationYear,
          chapter: validatedData.chapter || existingUser.chapter,
          currentLocation: validatedData.currentLocation || existingUser.currentLocation,
          currentOccupation: validatedData.currentOccupation || existingUser.currentOccupation,
          company: validatedData.company || existingUser.company,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json(updatedUser);
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        id: validatedData.id,
        email: validatedData.email,
        password: "", // No password stored as we use Supabase Auth
        firstName: validatedData.firstName || "User",
        lastName: validatedData.lastName || "",
        fullName: `${validatedData.firstName || "User"} ${validatedData.lastName || ""}`.trim(),
        phone: validatedData.phone,
        serviceNumber: validatedData.serviceNumber,
        squadron: validatedData.squadron,
        graduationYear: validatedData.graduationYear,
        chapter: validatedData.chapter,
        currentLocation: validatedData.currentLocation,
        currentOccupation: validatedData.currentOccupation,
        company: validatedData.company,
        role: validatedData.role,
        emailVerified: true, // Supabase handles email verification
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(newUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.flatten() },
        { status: 400 }
      );
    }

    console.error("Sync user error:", error);
    return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
  }
}
