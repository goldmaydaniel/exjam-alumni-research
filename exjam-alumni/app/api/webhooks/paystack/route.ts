import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { NotificationService } from "@/lib/edge-functions/notification-service";
import crypto from "crypto";

interface PaystackWebhook {
  event: string;
  data: {
    id: number;
    reference: string;
    amount: number;
    status: string;
    gateway_response: string;
    paid_at?: string;
    created_at: string;
    channel: string;
    currency: string;
    customer: {
      id: number;
      email: string;
      customer_code: string;
    };
    metadata?: {
      registrationId?: string;
      userId?: string;
      eventId?: string;
    };
  };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify webhook signature
    const signature = req.headers.get("x-paystack-signature");
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    if (!signature || !paystackSecret) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    const body = await req.text();

    // Verify signature
    const hash = crypto.createHmac("sha512", paystackSecret).update(body).digest("hex");

    if (signature !== hash) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    const webhook: PaystackWebhook = JSON.parse(body);
    console.log(`Paystack webhook received: ${webhook.event}`, webhook.data.reference);

    // Handle different webhook events
    switch (webhook.event) {
      case "charge.success":
        await handlePaymentSuccess(supabase, webhook);
        break;

      case "charge.failed":
        await handlePaymentFailed(supabase, webhook);
        break;

      case "transfer.success":
        await handleTransferSuccess(supabase, webhook);
        break;

      default:
        console.log(`Unhandled webhook event: ${webhook.event}`);
    }

    return NextResponse.json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("Payment webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function handlePaymentSuccess(supabase: any, webhook: PaystackWebhook) {
  const { reference, amount, customer, metadata } = webhook.data;

  try {
    // Find registration by reference
    const { data: registration, error: regError } = await supabase
      .from("registrations")
      .select(
        `
        *,
        user:users(*),
        event:events(*)
      `
      )
      .eq("payment_reference", reference)
      .single();

    if (regError || !registration) {
      console.error("Registration not found for reference:", reference);
      return;
    }

    // Update registration status
    const { error: updateError } = await supabase
      .from("registrations")
      .update({
        payment_status: "paid",
        payment_confirmed_at: webhook.data.paid_at || new Date().toISOString(),
        payment_method: "paystack",
        payment_gateway_response: webhook.data.gateway_response,
        amount: amount / 100, // Paystack amount is in kobo
      })
      .eq("id", registration.id);

    if (updateError) {
      console.error("Failed to update registration:", updateError);
      return;
    }

    // Send confirmation email
    try {
      const notificationService = new NotificationService();
      const badgeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/badge/${registration.id}/download`;

      await notificationService.sendPaymentConfirmation({
        recipient: customer.email,
        firstName: registration.user?.first_name || registration.first_name,
        lastName: registration.user?.last_name || registration.last_name,
        amount: (amount / 100).toFixed(2),
        paymentReference: reference,
        paymentDate: webhook.data.paid_at || new Date().toISOString(),
        paymentMethod: "Paystack",
        badgeUrl,
      });

      // Also send registration confirmation if not sent yet
      if (!registration.confirmation_email_sent) {
        await notificationService.sendRegistrationConfirmation({
          recipient: customer.email,
          firstName: registration.user?.first_name || registration.first_name,
          lastName: registration.user?.last_name || registration.last_name,
          ticketId: registration.ticket_id,
          amount: (amount / 100).toFixed(2),
          badgeUrl,
        });

        // Mark confirmation email as sent
        await supabase
          .from("registrations")
          .update({
            confirmation_email_sent: true,
            confirmation_email_sent_at: new Date().toISOString(),
          })
          .eq("id", registration.id);
      }
    } catch (emailError) {
      console.error("Failed to send payment confirmation email:", emailError);
    }

    // Log payment webhook
    await supabase
      .from("payment_webhook_logs")
      .insert({
        registration_id: registration.id,
        webhook_event: webhook.event,
        payment_reference: reference,
        amount: amount / 100,
        status: "processed",
        webhook_data: webhook.data,
        processed_at: new Date().toISOString(),
      })
      .catch((logError) => {
        console.error("Failed to log webhook:", logError);
      });

    console.log(`Payment confirmed for registration ${registration.id}`);
  } catch (error) {
    console.error("Error handling payment success:", error);
  }
}

async function handlePaymentFailed(supabase: any, webhook: PaystackWebhook) {
  const { reference, gateway_response } = webhook.data;

  try {
    // Update registration status
    const { error: updateError } = await supabase
      .from("registrations")
      .update({
        payment_status: "failed",
        payment_gateway_response: gateway_response,
        payment_failed_at: new Date().toISOString(),
      })
      .eq("payment_reference", reference);

    if (updateError) {
      console.error("Failed to update failed payment:", updateError);
    }

    // Log failed payment
    await supabase
      .from("payment_webhook_logs")
      .insert({
        webhook_event: webhook.event,
        payment_reference: reference,
        amount: webhook.data.amount / 100,
        status: "failed",
        webhook_data: webhook.data,
        processed_at: new Date().toISOString(),
      })
      .catch((logError) => {
        console.error("Failed to log failed webhook:", logError);
      });

    console.log(`Payment failed for reference ${reference}: ${gateway_response}`);
  } catch (error) {
    console.error("Error handling payment failure:", error);
  }
}

async function handleTransferSuccess(supabase: any, webhook: PaystackWebhook) {
  // Handle transfer success (e.g., refunds)
  console.log("Transfer success handled:", webhook.data.reference);

  // Log transfer webhook
  await supabase
    .from("payment_webhook_logs")
    .insert({
      webhook_event: webhook.event,
      payment_reference: webhook.data.reference,
      amount: webhook.data.amount / 100,
      status: "processed",
      webhook_data: webhook.data,
      processed_at: new Date().toISOString(),
    })
    .catch((logError) => {
      console.error("Failed to log transfer webhook:", logError);
    });
}
