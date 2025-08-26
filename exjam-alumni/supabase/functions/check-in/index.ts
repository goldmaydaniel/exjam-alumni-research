import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseServiceClient } from "../_shared/supabase.ts";
import { corsHeaders } from "../_shared/cors.ts";
import {
  createResponse,
  createErrorResponse,
  handleOptions,
  logRequest,
  validateAuth,
} from "../_shared/utils.ts";

interface CheckInRequest {
  qrData?: string;
  registrationId?: string;
  ticketId?: string;
  location?: string;
  adminId?: string;
}

interface CheckInResponse {
  success: boolean;
  registration: any;
  message: string;
  checkInTime: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleOptions();
  }

  logRequest("check-in", req.method);

  try {
    const supabase = createSupabaseServiceClient();
    const authToken = validateAuth(req);

    if (!authToken) {
      return createErrorResponse("Authorization required", 401);
    }

    if (req.method === "POST") {
      const {
        qrData,
        registrationId,
        ticketId,
        location = "Main Entrance",
        adminId,
      }: CheckInRequest = await req.json();

      let registration;

      // Handle QR code check-in
      if (qrData) {
        try {
          const parsedQR = JSON.parse(qrData);
          registrationId = parsedQR.registrationId;
        } catch (error) {
          return createErrorResponse("Invalid QR code format", 400);
        }
      }

      if (!registrationId && !ticketId) {
        return createErrorResponse("registrationId, ticketId, or qrData is required", 400);
      }

      // Fetch registration
      let query = supabase.from("registrations").select(`
          *,
          user:users(*),
          event:events(*)
        `);

      if (registrationId) {
        query = query.eq("id", registrationId);
      } else if (ticketId) {
        query = query.eq("ticket_id", ticketId);
      }

      const { data: regData, error: regError } = await query.single();

      if (regError || !regData) {
        return createErrorResponse("Registration not found", 404, regError);
      }

      registration = regData;

      // Check if already checked in
      if (registration.checked_in) {
        return createResponse({
          success: false,
          registration,
          message: `Already checked in at ${new Date(registration.checked_in_at).toLocaleString()}`,
          checkInTime: registration.checked_in_at,
        });
      }

      // Check payment status
      if (registration.payment_status !== "paid") {
        return createErrorResponse(
          `Payment not confirmed. Status: ${registration.payment_status}`,
          402
        );
      }

      // Perform check-in
      const checkInTime = new Date().toISOString();

      const { error: updateError } = await supabase
        .from("registrations")
        .update({
          checked_in: true,
          checked_in_at: checkInTime,
          check_in_location: location,
          checked_in_by: adminId,
        })
        .eq("id", registration.id);

      if (updateError) {
        return createErrorResponse("Failed to check in", 500, updateError);
      }

      // Log check-in activity
      await supabase
        .from("check_in_logs")
        .insert({
          registration_id: registration.id,
          user_id: registration.user_id,
          event_id: registration.event_id,
          admin_id: adminId,
          location,
          checked_in_at: checkInTime,
          method: qrData ? "qr_code" : "manual",
        })
        .catch((error) => console.error("Failed to log check-in:", error));

      const response: CheckInResponse = {
        success: true,
        registration: {
          ...registration,
          checked_in: true,
          checked_in_at: checkInTime,
        },
        message: "Successfully checked in",
        checkInTime,
      };

      logRequest("check-in", "POST", { registrationId: registration.id, success: true });
      return createResponse(response);
    }

    // GET request - fetch check-in status
    if (req.method === "GET") {
      const url = new URL(req.url);
      const registrationId = url.searchParams.get("registrationId");
      const ticketId = url.searchParams.get("ticketId");

      if (!registrationId && !ticketId) {
        return createErrorResponse("registrationId or ticketId parameter required", 400);
      }

      let query = supabase.from("registrations").select(`
          id,
          ticket_id,
          checked_in,
          checked_in_at,
          check_in_location,
          payment_status,
          user:users(first_name, last_name, email),
          event:events(title, event_date)
        `);

      if (registrationId) {
        query = query.eq("id", registrationId);
      } else {
        query = query.eq("ticket_id", ticketId);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        return createErrorResponse("Registration not found", 404, error);
      }

      return createResponse(data);
    }

    return createErrorResponse("Method not allowed", 405);
  } catch (error) {
    console.error("Check-in error:", error);
    return createErrorResponse("Internal server error", 500, error.message);
  }
});
