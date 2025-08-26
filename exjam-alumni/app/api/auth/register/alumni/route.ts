import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitConfigs } from "@/lib/rate-limit";
import { sendEmail, getWelcomeEmailTemplate } from "@/lib/email";

const alumniRegistrationSchema = z.object({
  // Account creation
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),

  // Personal details
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),

  // Alumni-specific fields
  serviceNumber: z.string().min(3, "Service number is required"),
  graduationYear: z.number().min(1960).max(new Date().getFullYear()),
  squadron: z.string().min(2, "Squadron is required"),
  currentOccupation: z.string().optional(),
  company: z.string().optional(),

  // Event registration (optional - if provided, register for event)
  eventId: z.string().optional(),
  ticketType: z.enum(["REGULAR", "VIP", "STUDENT"]).optional(),
  specialRequests: z.string().optional(),

  // Marketing consent
  marketingConsent: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimiter = rateLimit(rateLimitConfigs.auth);
    const rateLimitResult = await rateLimiter(req);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: rateLimitResult.error || "Too many registration attempts. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toISOString(),
            "Retry-After": Math.ceil(
              (rateLimitResult.reset.getTime() - Date.now()) / 1000
            ).toString(),
          },
        }
      );
    }

    const body = await req.json();
    const validatedData = alumniRegistrationSchema.parse(body);

    // Create Supabase client with service role
    const supabase = await createClient();

    // Check if user already exists in Supabase Auth
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(validatedData.email);

    if (existingUser.user) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    // Check if service number is already taken
    const { data: existingAlumni } = await supabase
      .from("User")
      .select("id")
      .eq("serviceNumber", validatedData.serviceNumber)
      .single();

    if (existingAlumni) {
      return NextResponse.json(
        { error: "This service number is already registered" },
        { status: 400 }
      );
    }

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: false, // Require email verification
      user_metadata: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        fullName: `${validatedData.firstName} ${validatedData.lastName}`,
        role: "ALUMNI",
      },
    });

    if (authError || !authUser.user) {
      console.error("Supabase Auth creation error:", authError);
      return NextResponse.json({ error: "Failed to create user account" }, { status: 500 });
    }

    // Create user profile in database
    const userId = authUser.user.id;
    const { data: userProfile, error: profileError } = await supabase
      .from("User")
      .insert({
        id: userId,
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        fullName: `${validatedData.firstName} ${validatedData.lastName}`,
        phone: validatedData.phone,
        serviceNumber: validatedData.serviceNumber,
        graduationYear: validatedData.graduationYear,
        squadron: validatedData.squadron,
        currentOccupation: validatedData.currentOccupation || null,
        company: validatedData.company || null,
        role: "ALUMNI",
        marketingConsent: validatedData.marketingConsent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: "Failed to create user profile" }, { status: 500 });
    }

    let registrationResult = null;

    // If event registration is requested, create registration
    if (validatedData.eventId) {
      try {
        // Verify event exists and has capacity
        const { data: event, error: eventError } = await supabase
          .from("Event")
          .select(
            `
            id,
            title,
            capacity,
            price,
            startDate,
            venue,
            _count:Registration(count)
          `
          )
          .eq("id", validatedData.eventId)
          .single();

        if (eventError || !event) {
          throw new Error("Event not found");
        }

        // Check capacity
        const currentRegistrations = event._count?.[0]?.count || 0;
        if (currentRegistrations >= event.capacity) {
          throw new Error("Event is fully booked");
        }

        // Create registration
        const registrationId = crypto.randomUUID();
        const { data: registration, error: regError } = await supabase
          .from("Registration")
          .insert({
            id: registrationId,
            userId,
            eventId: validatedData.eventId,
            ticketType: validatedData.ticketType || "REGULAR",
            specialRequests: validatedData.specialRequests || null,
            status: "PENDING",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .select(
            `
            id,
            ticketType,
            status,
            event:Event(
              id,
              title,
              startDate,
              venue
            )
          `
          )
          .single();

        if (regError) {
          throw new Error("Failed to create event registration");
        }

        registrationResult = {
          registrationId: registration.id,
          ticketType: registration.ticketType,
          event: registration.event,
        };
      } catch (regError) {
        console.error("Event registration error:", regError);
        // Don't fail the entire registration if event registration fails
        registrationResult = {
          error: regError instanceof Error ? regError.message : "Event registration failed",
        };
      }
    }

    // Send welcome email
    try {
      const welcomeEmailHtml = getWelcomeEmailTemplate(userProfile.fullName);

      await sendEmail({
        to: userProfile.email,
        subject: "Welcome to The ExJAM Association!",
        html: welcomeEmailHtml,
      });
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail registration if email fails
    }

    const responseData: any = {
      message:
        "Alumni account created successfully! Please check your email to verify your account.",
      user: {
        id: userProfile.id,
        email: userProfile.email,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        fullName: userProfile.fullName,
        serviceNumber: userProfile.serviceNumber,
        squadron: userProfile.squadron,
        graduationYear: userProfile.graduationYear,
        role: userProfile.role,
      },
    };

    if (registrationResult) {
      responseData.registration = registrationResult;
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Alumni registration error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid registration data",
          details: error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
