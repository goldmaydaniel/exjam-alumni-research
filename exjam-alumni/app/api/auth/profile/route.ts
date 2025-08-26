export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/unified-auth";
import { queries, db } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    // Get user profile from database using our queries helper
    const profile = await queries.getUserById(user.id);

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Return safe user data
    return NextResponse.json({
      id: profile.id,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      fullName: profile.fullName,
      serviceNumber: profile.serviceNumber,
      squadron: profile.squadron,
      phone: profile.phone,
      chapter: profile.chapter,
      currentLocation: profile.currentLocation,
      emergencyContact: profile.emergencyContact,
      graduationYear: profile.graduationYear,
      currentOccupation: profile.currentOccupation,
      company: profile.company,
      role: profile.role,
      emailVerified: profile.emailVerified,
      profilePhoto: profile.profilePhoto,
      bio: profile.bio,
      createdAt: profile.createdAt,
      registrationCount: profile.Registration.length,
      paymentCount: profile.Payment.length,
      ticketCount: profile.Ticket.length,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("Get profile error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();

    // Update user profile in database using our db helper
    const updatedProfile = await db.user.update({
      where: { id: user.id },
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
        bio: body.bio,
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
        bio: true,
        role: true,
        emailVerified: true,
        profilePhoto: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("Update profile error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
