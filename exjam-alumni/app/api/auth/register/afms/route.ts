import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { Squadron, UserRole, RegistrationStatus } from "@prisma/client";
import {
  sendEmail,
  getWelcomeEmailTemplate,
  getRegistrationConfirmationTemplate,
} from "@/lib/email";
import { isEventFull, addToWaitlist } from "@/lib/waitlist";
import { rateLimit, rateLimitConfigs } from "@/lib/rate-limit";

const afmsRegistrationSchema = z.object({
  // Personal Information
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  serviceNumber: z.string().optional(),
  squadron: z.enum(["GREEN", "RED", "PURPLE", "YELLOW", "DORNIER", "PUMA"] as const),
  profilePhoto: z.string().optional(),

  // Contact Information
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  chapter: z.string().min(1, "Chapter is required"),
  currentLocation: z.string().min(2, "Current location is required"),
  emergencyContact: z.string().min(10, "Emergency contact is required"),

  // Event Details
  arrivalDate: z.string().min(1, "Arrival date is required"),
  departureDate: z.string().min(1, "Departure date is required"),
  expectations: z.string().optional(),
  specialRequests: z.string().optional(),

  // Event Package Information
  eventPackage: z.string().optional(),
  badgeType: z.string().optional(),
  totalAmount: z.number().optional(),

  // Account Details (optional for guest registration)
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional()
    .or(z.literal("")),
  isGuest: z.boolean().optional(),
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

    // Validate the request body
    const validatedData = afmsRegistrationSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    // Handle guest registration (no password or empty password)
    const isGuest =
      validatedData.isGuest || !validatedData.password || validatedData.password === "";
    let hashedPassword = null;

    if (!isGuest && validatedData.password && validatedData.password !== "") {
      // Hash the password for non-guest users
      hashedPassword = await bcrypt.hash(validatedData.password, 10);
    } else {
      // Generate a random password for guests (they won't use it)
      const randomPassword = crypto.randomUUID();
      hashedPassword = await bcrypt.hash(randomPassword, 10);
    }

    // Parse name parts from full name
    const nameParts = validatedData.fullName.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || nameParts[0];

    // Create the user with all AFMS-specific fields
    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email: validatedData.email,
        password: hashedPassword!,
        firstName,
        lastName,
        fullName: validatedData.fullName,
        serviceNumber: validatedData.serviceNumber || null,
        squadron: validatedData.squadron as Squadron,
        phone: validatedData.phone,
        chapter: validatedData.chapter,
        currentLocation: validatedData.currentLocation,
        emergencyContact: validatedData.emergencyContact,
        graduationYear: null,
        role: UserRole.GUEST_MEMBER, // Alumni start as unverified members
        emailVerified: false, // All new registrations need email verification
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
        role: true,
      },
    });

    // AFMS registration creates user account first, event registration is separate
    let registrationId = null;
    let isWaitlisted = false;
    let waitlistPosition = 0;

    // Optional: Try to register for a default event if one exists
    const defaultEvent = await prisma.event.findFirst({
      where: {
        status: "PUBLISHED",
        startDate: {
          gte: new Date(),
        },
      },
      orderBy: {
        startDate: "asc",
      },
    });

    if (defaultEvent) {
      try {
        // Check if event is full
        const { isFull } = await isEventFull(defaultEvent.id);

        if (isFull) {
          // Add to waitlist
          const waitlistResult = await addToWaitlist({
            userId: user.id,
            eventId: defaultEvent.id,
            ticketType: "REGULAR",
          });

          if (waitlistResult.success) {
            isWaitlisted = true;
            waitlistPosition = waitlistResult.position || 0;

            // Create a WAITLISTED registration entry
            const registration = await prisma.registration.create({
              data: {
                id: crypto.randomUUID(),
                userId: user.id,
                eventId: defaultEvent.id,
                arrivalDate: validatedData.arrivalDate,
                departureDate: validatedData.departureDate,
                expectations: validatedData.expectations || null,
                specialRequests: validatedData.specialRequests || null,
                photoUrl: validatedData.profilePhoto || null,
                status: RegistrationStatus.WAITLISTED,
                updatedAt: new Date(),
              },
            });
            registrationId = registration.id;
          }
        } else {
          // Create normal registration for the event
          const registration = await prisma.registration.create({
            data: {
              id: crypto.randomUUID(),
              userId: user.id,
              eventId: defaultEvent.id,
              arrivalDate: validatedData.arrivalDate,
              departureDate: validatedData.departureDate,
              expectations: validatedData.expectations || null,
              specialRequests: validatedData.specialRequests || null,
              photoUrl: validatedData.profilePhoto || null,
              status: RegistrationStatus.PENDING,
              updatedAt: new Date(),
            },
          });
          registrationId = registration.id;
        }
      } catch (eventRegistrationError) {
        console.error(
          "Event registration failed, but user account was created:",
          eventRegistrationError
        );
        // Continue without event registration - user account creation is the primary goal
      }
    }

    // No JWT tokens needed - using Supabase Auth

    // Send welcome email using professional template
    try {
      const welcomeEmailHtml = getWelcomeEmailTemplate(user.fullName || user.email);

      await sendEmail({
        to: user.email,
        subject: "Welcome to The ExJAM Association Conference 2025!",
        html: welcomeEmailHtml,
      });

      // If user registered for an event and is not waitlisted, send registration confirmation
      // (waitlisted users already get a waitlist notification email)
      if (defaultEvent && registrationId && !isWaitlisted) {
        const registrationDetails = {
          name: user.fullName || user.email,
          email: user.email,
          ticketNumber: `REG-${registrationId.slice(0, 8).toUpperCase()}`,
          ticketType: "REGULAR",
          eventDetails: {
            title: defaultEvent.title,
            date: defaultEvent.startDate.toLocaleDateString("en-NG", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            time: defaultEvent.startDate.toLocaleTimeString("en-NG", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            venue: defaultEvent.venue,
            address: defaultEvent.address || "Address to be confirmed",
            description: defaultEvent.description || undefined,
            imageUrl: defaultEvent.imageUrl || undefined,
          },
        };

        const confirmationEmailHtml = getRegistrationConfirmationTemplate(registrationDetails);

        // Send registration confirmation email after a short delay
        setTimeout(async () => {
          try {
            await sendEmail({
              to: user.email,
              subject: `Registration Confirmed - ${defaultEvent.title}`,
              html: confirmationEmailHtml,
            });
          } catch (error) {
            console.error("Failed to send registration confirmation email:", error);
          }
        }, 2000);
      }
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail the registration if email fails
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        squadron: user.squadron,
        chapter: user.chapter,
        role: user.role,
      },
      registrationId,
      isGuest,
      isWaitlisted,
      waitlistPosition,
      message: isWaitlisted
        ? `You've been added to the waitlist (position #${waitlistPosition}). We'll notify you if a spot becomes available!`
        : "Registration successful! Please check your email to verify your account and complete your membership.",
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error instanceof z.ZodError) {
      console.error("Validation errors:", error.flatten());
      return NextResponse.json(
        { error: "Validation error", details: error.flatten() },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Registration failed";
    console.error("Error message:", errorMessage);

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
