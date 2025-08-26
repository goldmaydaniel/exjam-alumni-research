import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    // Check if this is a development environment
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "This endpoint is only available in development" },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // First, try to sign up the admin user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: "admin@exjamalumni.org",
      password: "Admin123",
      options: {
        data: {
          firstName: "Super",
          lastName: "Admin",
          fullName: "Super Admin",
          serviceNumber: "AFMS 00/0001",
          squadron: "ALPHA",
          phone: "+234 123 456 7890",
          chapter: "Lagos",
          currentLocation: "Lagos, Nigeria",
          role: "ADMIN",
        },
      },
    });

    let userId: string;

    if (signUpError) {
      // If user already exists, try to sign in to get the user ID
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: "admin@exjamalumni.org",
        password: "Admin123",
      });

      if (signInError) {
        console.error("Sign in error:", signInError);
        // User exists but password is different
        // We'll just update the database record
        const existingUser = await prisma.user.findUnique({
          where: { email: "admin@exjamalumni.org" },
        });

        if (existingUser) {
          userId = existingUser.id;
        } else {
          return NextResponse.json(
            { error: "Admin user setup failed. Please create manually in Supabase dashboard." },
            { status: 500 }
          );
        }
      } else {
        userId = signInData.user!.id;
      }
    } else {
      userId = signUpData.user!.id;
    }

    // Now create or update the user in our database
    const hashedPassword = await bcrypt.hash("Admin123", 10);

    const adminUser = await prisma.user.upsert({
      where: { email: "admin@exjamalumni.org" },
      update: {
        password: hashedPassword,
        role: "ADMIN",
        emailVerified: true,
        firstName: "Super",
        lastName: "Admin",
        fullName: "Super Admin",
        serviceNumber: "AFMS 00/0001",
        squadron: "ALPHA",
        phone: "+234 123 456 7890",
        chapter: "Lagos",
        currentLocation: "Lagos, Nigeria",
        emergencyContact: "+234 987 654 3210",
        updatedAt: new Date(),
      },
      create: {
        id: userId, // Use Supabase user ID
        email: "admin@exjamalumni.org",
        password: hashedPassword,
        firstName: "Super",
        lastName: "Admin",
        fullName: "Super Admin",
        serviceNumber: "AFMS 00/0001",
        squadron: "ALPHA",
        phone: "+234 123 456 7890",
        chapter: "Lagos",
        currentLocation: "Lagos, Nigeria",
        emergencyContact: "+234 987 654 3210",
        graduationYear: "2000",
        currentOccupation: "System Administrator",
        company: "The ExJAM Association",
        role: "ADMIN",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Admin user created/updated successfully",
      email: "admin@exjamalumni.org",
      note: "Use password: Admin123 to login",
    });
  } catch (error) {
    console.error("Error creating admin user:", error);
    return NextResponse.json(
      { error: "Failed to create admin user", details: error },
      { status: 500 }
    );
  }
}
