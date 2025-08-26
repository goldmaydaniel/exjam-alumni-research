export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    // Use Supabase Auth only
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = user.id;

    // Get user profile from database
    const profile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        fullName: true,
        serviceNumber: true,
        squadron: true,
        phone: true,
        chapter: true,
        currentLocation: true,
        emergencyContact: true,
        graduationYear: true,
        currentOccupation: true,
        company: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        _count: {
          select: {
            Registration: true,
            Payment: true,
            Ticket: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Use Supabase Auth only
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = user.id;

    const body = await req.json();

    // Update user profile in database
    const updatedProfile = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        fullName: `${body.firstName || ""} ${body.lastName || ""}`.trim(),
        phone: body.phone,
        serviceNumber: body.serviceNumber,
        squadron: body.squadron,
        graduationYear: body.graduationYear,
        chapter: body.chapter,
        currentLocation: body.currentLocation,
        emergencyContact: body.emergencyContact,
        currentOccupation: body.currentOccupation,
        company: body.company,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        fullName: true,
        serviceNumber: true,
        squadron: true,
        phone: true,
        chapter: true,
        currentLocation: true,
        emergencyContact: true,
        graduationYear: true,
        currentOccupation: true,
        company: true,
        role: true,
        emailVerified: true,
      },
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
