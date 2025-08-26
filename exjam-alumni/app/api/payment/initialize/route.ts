import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { paystackService } from "@/lib/payment/paystack";
import { rateLimit, rateLimitConfigs } from "@/lib/rate-limit";

const paymentInitSchema = z.object({
  registrationId: z.string().uuid("Invalid registration ID"),
  callbackUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimiter = rateLimit(rateLimitConfigs.api);
    const rateLimitResult = await rateLimiter(req);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many payment requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validatedData = paymentInitSchema.parse(body);

    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get registration details with event and user info
    const { data: registration, error: regError } = await supabase
      .from("Registration")
      .select(
        `
        id,
        ticketType,
        status,
        userId,
        eventId,
        user:User!userId(
          id,
          email,
          firstName,
          lastName,
          fullName
        ),
        event:Event!eventId(
          id,
          title,
          price,
          earlyBirdPrice,
          earlyBirdDeadline
        )
      `
      )
      .eq("id", validatedData.registrationId)
      .eq("userId", user.id)
      .single();

    if (regError || !registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    // Check if registration is already paid
    if (registration.status === "CONFIRMED") {
      return NextResponse.json({ error: "Registration already paid" }, { status: 400 });
    }

    // Check if registration is cancelled
    if (registration.status === "CANCELLED") {
      return NextResponse.json({ error: "Registration has been cancelled" }, { status: 400 });
    }

    // Calculate payment amount
    const event = registration.event;
    const isEarlyBird = event.earlyBirdDeadline && new Date(event.earlyBirdDeadline) > new Date();
    let basePrice = isEarlyBird && event.earlyBirdPrice ? event.earlyBirdPrice : event.price;

    // Apply ticket type multipliers
    const ticketMultipliers = {
      REGULAR: 1,
      VIP: 1.5,
      STUDENT: 0.5,
    };

    const finalPrice =
      basePrice *
      (ticketMultipliers[registration.ticketType as keyof typeof ticketMultipliers] || 1);
    const amountInKobo = paystackService.nairaToKobo(finalPrice);

    // Generate payment reference
    const paymentReference = paystackService.generatePaymentReference("EVENT");

    // Initialize payment with Paystack
    const paymentData = {
      email: registration.user.email,
      amount: amountInKobo,
      reference: paymentReference,
      callback_url:
        validatedData.callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
      metadata: {
        userId: registration.userId,
        eventId: event.id,
        registrationId: registration.id,
        ticketType: registration.ticketType,
        userName:
          registration.user.fullName ||
          `${registration.user.firstName} ${registration.user.lastName}`,
        eventTitle: event.title,
      },
    };

    const paymentResponse = await paystackService.initializePayment(paymentData);

    if (!paymentResponse.status) {
      throw new Error(paymentResponse.message || "Payment initialization failed");
    }

    // Save payment reference to registration
    const { error: updateError } = await supabase
      .from("Registration")
      .update({
        paymentReference,
        paymentAmount: finalPrice,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", registration.id);

    if (updateError) {
      console.error("Failed to update registration with payment reference:", updateError);
    }

    return NextResponse.json({
      success: true,
      data: {
        authorization_url: paymentResponse.data?.authorization_url,
        access_code: paymentResponse.data?.access_code,
        reference: paymentReference,
        amount: finalPrice,
        currency: "NGN",
        event: {
          id: event.id,
          title: event.title,
        },
        registration: {
          id: registration.id,
          ticketType: registration.ticketType,
        },
      },
    });
  } catch (error) {
    console.error("Payment initialization error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid payment data", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Payment initialization failed. Please try again." },
      { status: 500 }
    );
  }
}
