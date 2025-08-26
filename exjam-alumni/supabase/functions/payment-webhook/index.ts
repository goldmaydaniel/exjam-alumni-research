import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseServiceClient } from "../_shared/supabase.ts";
import { corsHeaders } from "../_shared/cors.ts";
import {
  createResponse,
  createErrorResponse,
  handleOptions,
  logRequest,
} from "../_shared/utils.ts";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleOptions();
  }

  logRequest("payment-webhook", req.method);

  try {
    const supabase = createSupabaseServiceClient();

    if (req.method === "POST") {
      // Verify webhook signature
      const signature = req.headers.get("x-paystack-signature");
      const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY");

      if (!signature || !paystackSecret) {
        return createErrorResponse("Invalid webhook signature", 401);
      }

      const body = await req.text();

      // Verify signature
      const hash = await crypto.subtle.digest(
        "SHA-512",
        new TextEncoder().encode(paystackSecret + body)
      );
      const expectedSignature = Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      if (signature !== expectedSignature) {
        return createErrorResponse("Invalid webhook signature", 401);
      }

      const webhook: PaystackWebhook = JSON.parse(body);
      logRequest("payment-webhook", "POST", {
        event: webhook.event,
        reference: webhook.data.reference,
      });

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

      return createResponse({ message: "Webhook processed successfully" });
    }

    return createErrorResponse("Method not allowed", 405);
  } catch (error) {
    console.error("Payment webhook error:", error);
    return createErrorResponse("Internal server error", 500, error.message);
  }
});

async function handlePaymentSuccess(supabase: any, webhook: PaystackWebhook) {
  const { data, reference, amount, customer, metadata } = webhook.data;

  try {
    // Find registration by reference
    const { data: registration, error: regError } = await supabase
      .from("registrations")
      .select("*")
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
    await supabase.functions
      .invoke("send-notification", {
        body: {
          type: "email",
          recipient: customer.email,
          template: "registration-confirmation",
          data: {
            firstName: registration.first_name,
            lastName: registration.last_name,
            ticketId: registration.ticket_id,
            amount: (amount / 100).toFixed(2),
            badgeUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-badge?registrationId=${registration.id}`,
          },
          metadata: {
            registrationId: registration.id,
            userId: registration.user_id,
            eventId: registration.event_id,
          },
        },
      })
      .catch((error) => {
        console.error("Failed to send confirmation email:", error);
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

    console.log(`Payment failed for reference ${reference}: ${gateway_response}`);
  } catch (error) {
    console.error("Error handling payment failure:", error);
  }
}

async function handleTransferSuccess(supabase: any, webhook: PaystackWebhook) {
  // Handle transfer success (e.g., refunds)
  console.log("Transfer success handled:", webhook.data.reference);
}
