import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { rateLimit, rateLimitConfigs } from "@/lib/rate-limit";
import { signUp, AuthError } from "@/lib/auth/unified-auth";
import { createClient } from "@/lib/supabase/server";
import {
  sendEmail,
  getWelcomeEmailTemplate,
  getRegistrationConfirmationTemplate,
} from "@/lib/email";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().optional(),
  graduationYear: z.string().optional(),
  currentOccupation: z.string().optional(),
  company: z.string().optional(),

  // General user specific fields
  organization: z.string().optional(),
  jobTitle: z.string().optional(),
  relationshipToAlumni: z.string().optional(),
  alumniConnection: z.string().optional(),

  // Event registration (optional)
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
    const validatedData = registerSchema.parse(body);

    // Use unified auth system
    const authData = await signUp(validatedData.email, validatedData.password, {
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      fullName: `${validatedData.firstName} ${validatedData.lastName}`,
      phone: validatedData.phone,
      graduationYear: validatedData.graduationYear,
      currentLocation: validatedData.organization,
      role: 'GUEST_MEMBER'
    });

    const supabase = await createClient();

    // Get the created user record
    const { data: user, error: userError } = await supabase
      .from("User")
      .select("*")
      .eq("id", authData.user!.id)
      .single();

    if (userError || !user) {
      console.error("Failed to fetch user record:", userError);
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
            userId: authData.user!.id,
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
      const welcomeEmailHtml = getWelcomeEmailTemplate(user.fullName);

      await sendEmail({
        to: user.email,
        subject: "Welcome to The ExJAM Association!",
        html: welcomeEmailHtml,
      });
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail registration if email fails
    }

    const responseData: any = {
      message: "Account created successfully! Please check your email to verify your account.",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        phone: user.phone,
        company: user.company,
        currentOccupation: user.currentOccupation,
        relationshipToAlumni: user.relationshipToAlumni,
        role: user.role,
      },
      session: authData.session,
    };

    if (registrationResult) {
      responseData.registration = registrationResult;
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Registration error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid registration data",
          details: error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
