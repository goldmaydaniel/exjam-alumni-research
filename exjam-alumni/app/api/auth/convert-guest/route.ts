import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { generateToken } from "@/lib/auth";

const convertGuestSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate the request body
    const validatedData = convertGuestSchema.parse(body);

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user) {
      return NextResponse.json({ error: "No registration found with this email" }, { status: 404 });
    }

    // Check if user already has a proper account
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "This email already has an active account. Please login instead." },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Update the user to convert from guest to full account
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        emailVerified: true,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        fullName: true,
        squadron: true,
        chapter: true,
        role: true,
      },
    });

    // Generate JWT token
    const token = generateToken(updatedUser.id);

    return NextResponse.json({
      user: updatedUser,
      token,
      message:
        "Account created successfully! You can now login anytime to access your badge and manage registrations.",
    });
  } catch (error) {
    console.error("Convert guest error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
