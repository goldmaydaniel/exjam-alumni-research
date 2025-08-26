import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { NotificationService } from "@/lib/edge-functions/notification-service";
import { z } from "zod";

const sendNotificationSchema = z.object({
  type: z.enum(["email", "sms", "push"]),
  recipient: z.string().email(),
  template: z.string(),
  data: z.record(z.any()).optional(),
  metadata: z
    .object({
      eventId: z.string().optional(),
      userId: z.string().optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = sendNotificationSchema.parse(body);

    const notificationService = new NotificationService();
    const result = await notificationService.sendNotification(validatedData);

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to send notification", details: result.error },
        { status: 500 }
      );
    }

    // Log notification in database
    try {
      await supabase.from("notification_logs").insert({
        user_id: user.id,
        type: validatedData.type,
        recipient: validatedData.recipient,
        template: validatedData.template,
        status: "sent",
        external_id: result.id,
        metadata: validatedData.metadata,
        sent_at: new Date().toISOString(),
      });
    } catch (logError) {
      console.error("Failed to log notification:", logError);
    }

    return NextResponse.json({
      success: true,
      id: result.id,
      type: validatedData.type,
      recipient: validatedData.recipient,
      template: validatedData.template,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.flatten() },
        { status: 400 }
      );
    }

    console.error("Send notification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper endpoint for sending registration confirmations
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication - service role or admin only
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { registrationId } = await req.json();

    if (!registrationId) {
      return NextResponse.json({ error: "Registration ID required" }, { status: 400 });
    }

    // Fetch registration data
    const { data: registration, error: regError } = await supabase
      .from("registrations")
      .select(
        `
        *,
        user:users(*),
        event:events(*)
      `
      )
      .eq("id", registrationId)
      .single();

    if (regError || !registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    const notificationService = new NotificationService();
    const badgeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/badge/${registrationId}/download`;

    const result = await notificationService.sendRegistrationConfirmation({
      recipient: registration.user.email,
      firstName: registration.user.first_name,
      lastName: registration.user.last_name,
      ticketId: registration.ticket_id,
      amount: registration.amount?.toString() || "0",
      badgeUrl,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to send confirmation", details: result.error },
        { status: 500 }
      );
    }

    // Update registration with email sent flag
    await supabase
      .from("registrations")
      .update({
        confirmation_email_sent: true,
        confirmation_email_sent_at: new Date().toISOString(),
      })
      .eq("id", registrationId);

    return NextResponse.json({
      success: true,
      id: result.id,
      message: "Registration confirmation sent successfully",
    });
  } catch (error) {
    console.error("Send registration confirmation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
