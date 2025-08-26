import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Schema for basic signup
const basicSignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  isBasicSignup: z.literal(true),
});

// Schema for membership registration
const membershipSignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().min(10),
  serviceNumber: z.string().regex(/^AFMS\s?\d{2,4}\/\d{4}$/i),
  squadron: z.enum(["GREEN", "RED", "PURPLE", "YELLOW", "DORNIER", "PUMA"]),
  graduationYear: z.string().min(4),
  chapter: z.string().min(1),
  currentLocation: z.string().min(3),
  country: z.string().default("Nigeria"),
  occupation: z.string().min(3),
  company: z.string().optional(),
  membershipType: z.enum(["annual", "lifetime", "student"]),
  isMembershipRegistration: z.literal(true),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Determine registration type
    const isBasicSignup = body.isBasicSignup === true;
    const isMembershipSignup = body.isMembershipRegistration === true;

    if (!isBasicSignup && !isMembershipSignup) {
      return NextResponse.json({ error: "Invalid registration type" }, { status: 400 });
    }

    // Validate data based on signup type
    const validatedData = isBasicSignup
      ? basicSignupSchema.parse(body)
      : membershipSignupSchema.parse(body);

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("user_profiles")
      .select("email")
      .eq("email", validatedData.email)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: true, // Auto-confirm for now
      user_metadata: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        registrationType: isBasicSignup ? "basic" : "membership",
      },
    });

    if (authError) {
      console.error("Auth signup error:", authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    const userId = authData.user.id;

    // Create user profile
    const userProfileData = {
      user_id: userId,
      first_name: validatedData.firstName,
      last_name: validatedData.lastName,
      email: validatedData.email,
      user_type: isBasicSignup ? "basic" : "alumni_member",
      is_verified: false,
      ...(isMembershipSignup && {
        phone: (validatedData as any).phone,
        current_location: (validatedData as any).currentLocation,
        country: (validatedData as any).country,
        occupation: (validatedData as any).occupation,
        company: (validatedData as any).company || null,
      }),
    };

    const { data: userProfile, error: profileError } = await supabase
      .from("user_profiles")
      .insert(userProfileData)
      .select()
      .single();

    if (profileError) {
      console.error("User profile creation error:", profileError);
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: "Failed to create user profile" }, { status: 500 });
    }

    // If membership registration, create alumni profile
    if (isMembershipSignup) {
      const membershipData = validatedData as z.infer<typeof membershipSignupSchema>;

      // Extract set number from service number
      const setMatch = membershipData.serviceNumber.match(/AFMS\s?(\d{2,4})\//);
      const setNumber = setMatch ? setMatch[1] : "00";

      const alumniProfileData = {
        user_id: userId,
        service_number: membershipData.serviceNumber,
        squadron: membershipData.squadron,
        set_number: setNumber,
        graduation_year: membershipData.graduationYear,
        chapter: membershipData.chapter,
        achievements: [],
        interests: [],
        is_active: true,
      };

      const { data: alumniProfile, error: alumniError } = await supabase
        .from("alumni_profiles")
        .insert(alumniProfileData)
        .select()
        .single();

      if (alumniError) {
        console.error("Alumni profile creation error:", alumniError);
        // Clean up user profile and auth user
        await supabase.from("user_profiles").delete().eq("user_id", userId);
        await supabase.auth.admin.deleteUser(userId);

        // Check for duplicate service number
        if (alumniError.code === "23505" && alumniError.constraint === "unique_service_number") {
          return NextResponse.json({ error: "Service number already registered" }, { status: 400 });
        }

        return NextResponse.json({ error: "Failed to create alumni profile" }, { status: 500 });
      }

      // Create activity log
      await supabase.from("alumni_activities").insert({
        alumni_id: alumniProfile.id,
        activity_type: "joined",
        activity_data: {
          name: `${validatedData.firstName} ${validatedData.lastName}`,
          squadron: membershipData.squadron,
          set: setNumber,
          chapter: membershipData.chapter,
        },
        is_public: true,
      });
    }

    // Generate JWT token for immediate login
    const tokenPayload = {
      userId: userId,
      email: validatedData.email,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      userType: isBasicSignup ? "basic" : "alumni_member",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET!);

    // Set cookie
    const response = NextResponse.json({
      user: {
        id: userId,
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        userType: isBasicSignup ? "basic" : "alumni_member",
        isAlumni: !isBasicSignup,
        needsProfileCompletion: isBasicSignup,
      },
      message: isBasicSignup
        ? "Account created successfully! Welcome to EXJAM."
        : "Alumni profile created successfully! Complete your membership to access all features.",
    });

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
