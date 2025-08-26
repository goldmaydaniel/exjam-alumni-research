import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    console.log("Direct login attempt for:", email);

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        fullName: true,
        serviceNumber: true,
        squadron: true,
        phone: true,
        chapter: true,
        currentLocation: true,
        graduationYear: true,
        currentOccupation: true,
        company: true,
        role: true,
        emailVerified: true,
      },
    });

    console.log("User found:", user ? "Yes" : "No");

    if (!user) {
      console.log("User not found for email:", email);
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    console.log("User details:", { id: user.id, email: user.email, hasPassword: !!user.password });

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log("Password validation result:", isValidPassword);

    if (!isValidPassword) {
      console.log("Password validation failed for user:", user.email);
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Create JWT token
    const jwtSecret = process.env.JWT_SECRET || "fallback-secret-key";
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: "24h" }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      token,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Direct login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
