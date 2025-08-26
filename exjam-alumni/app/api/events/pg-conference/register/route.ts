import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const pgConferenceSchema = z.object({
  fullName: z.string().min(2),
  serviceNumber: z.string().optional(),
  graduationYear: z.string(),
  squadron: z.string(),
  email: z.string().email(),
  phone: z.string(),
  chapter: z.string(),
  currentLocation: z.string(),
  emergencyContact: z.string(),
  arrivalDate: z.string(),
  departureDate: z.string(),
  expectations: z.string().optional(),
  profilePhoto: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = pgConferenceSchema.parse(body);

    const supabase = await createClient();

    // Upload photo to Supabase Storage if provided
    let photoUrl = null;
    if (validatedData.profilePhoto) {
      const base64Data = validatedData.profilePhoto.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      // Create unique filename
      const fileName = `pg-conference-2025/${Date.now()}-${validatedData.email.replace("@", "-")}.jpg`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("event-photos")
        .upload(fileName, buffer, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        console.error("Photo upload error:", uploadError);
        // Continue without photo if upload fails
      } else {
        // Get public URL
        const { data: urlData } = supabase.storage.from("event-photos").getPublicUrl(fileName);

        photoUrl = urlData?.publicUrl;
      }
    }

    // Create registration record in PGConferenceRegistration table
    const paymentReference = `PG2025-${Date.now().toString().slice(-6)}${Math.random().toString(36).substring(2, 4).toUpperCase()}`;

    const { data: registration, error: registrationError } = await supabase
      .from("PGConferenceRegistration")
      .insert({
        fullName: validatedData.fullName,
        serviceNumber: validatedData.serviceNumber,
        graduationYear: validatedData.graduationYear,
        squadron: validatedData.squadron,
        email: validatedData.email,
        phone: validatedData.phone,
        chapter: validatedData.chapter,
        currentLocation: validatedData.currentLocation,
        emergencyContact: validatedData.emergencyContact,
        arrivalDate: validatedData.arrivalDate,
        departureDate: validatedData.departureDate,
        expectations: validatedData.expectations,
        profilePhotoUrl: photoUrl,
        badgeStatus: "PENDING",
        paymentStatus: "UNPAID",
        paymentReference: paymentReference,
      })
      .select()
      .single();

    if (registrationError) {
      console.error("Registration error:", registrationError);
      return NextResponse.json({ error: "Failed to create registration" }, { status: 500 });
    }

    // Bank payment details
    const bankDetails = {
      bankName: "First Bank of Nigeria",
      accountName: "The ExJAM Association",
      accountNumber: "2034567890",
      amount: "₦25,000",
      reference: registration.paymentReference,
    };

    return NextResponse.json({
      success: true,
      registration: {
        id: registration.id,
        fullName: validatedData.fullName, // From form data since not stored in Registration
        email: validatedData.email, // From form data since not stored in Registration
        badgeStatus: "pending",
        profilePhotoUrl: photoUrl,
        status: registration.status,
      },
      bankDetails,
      message:
        "Registration successful! Please proceed with payment to complete your registration.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 });
    }

    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
