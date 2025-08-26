import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, AuthError } from "@/lib/auth/unified-auth";
import { eventRegistrationService } from "@/lib/services/event-registration";
import { withRateLimit, rateLimitConfigs } from "@/lib/rate-limit";

const registrationSchema = z.object({
  eventId: z.string().uuid(),
  ticketType: z.enum(["REGULAR", "VIP", "STUDENT"]),
  arrivalDate: z.string().datetime().optional(),
  departureDate: z.string().datetime().optional(),
  expectations: z.string().max(500).optional(),
  specialRequests: z.string().max(500).optional(),
  profilePhoto: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  return withRateLimit(req, rateLimitConfigs.registration, async () => {
    try {
      const user = await requireAuth(req);
      const body = await req.json();
      const validatedData = registrationSchema.parse(body);

      // Use the optimized registration service
      const result = await eventRegistrationService.registerForEvent({
        eventId: validatedData.eventId,
        userId: user.id,
        ticketType: validatedData.ticketType,
        arrivalDate: validatedData.arrivalDate ? new Date(validatedData.arrivalDate) : undefined,
        departureDate: validatedData.departureDate ? new Date(validatedData.departureDate) : undefined,
        expectations: validatedData.expectations,
        specialRequests: validatedData.specialRequests,
        profilePhoto: validatedData.profilePhoto,
      });

      if (!result.success) {
        const statusCode = result.error === 'EVENT_NOT_FOUND' ? 404 : 
                          result.error === 'ALREADY_REGISTERED' ? 409 : 
                          result.error === 'REGISTRATION_CLOSED' ? 400 : 400;
        
        return NextResponse.json({ 
          error: result.message,
          code: result.error 
        }, { status: statusCode });
      }

      // If registration successful
      if (result.registration) {
        return NextResponse.json({
          success: true,
          registration: result.registration,
          message: result.message,
          paymentRequired: result.paymentRequired,
          nextStep: result.paymentRequired ? 'payment' : 'confirmation'
        });
      }

      // If added to waitlist
      if (result.waitlistPosition) {
        return NextResponse.json({
          success: true,
          waitlisted: true,
          position: result.waitlistPosition,
          message: result.message,
          paymentRequired: false,
          nextStep: 'waitlist_confirmation'
        });
      }

      return NextResponse.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation error", details: error.flatten() },
          { status: 400 }
        );
      }

      if (error instanceof AuthError) {
        return NextResponse.json({ error: error.message }, { status: error.statusCode });
      }

      console.error("Registration error:", error);
      return NextResponse.json({ error: "Failed to create registration" }, { status: 500 });
    }
  });
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    // Use the registration service to get user registrations
    const registrations = await eventRegistrationService.getUserRegistrations(user.id);

    return NextResponse.json(registrations);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("Fetch registrations error:", error);
    return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 });
  }
}
