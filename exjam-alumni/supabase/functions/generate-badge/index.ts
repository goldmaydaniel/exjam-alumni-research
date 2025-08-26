import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseServiceClient } from "../_shared/supabase.ts";
import { corsHeaders } from "../_shared/cors.ts";
import {
  createResponse,
  createErrorResponse,
  handleOptions,
  logRequest,
} from "../_shared/utils.ts";

interface BadgeRequest {
  registrationId: string;
  userId?: string;
  eventId?: string;
}

interface BadgeData {
  firstName: string;
  lastName: string;
  ticketId: string;
  eventTitle: string;
  eventDate: string;
  qrData: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleOptions();
  }

  logRequest("generate-badge", req.method);

  try {
    const supabase = createSupabaseServiceClient();

    if (req.method === "POST") {
      const { registrationId, userId, eventId }: BadgeRequest = await req.json();

      if (!registrationId) {
        return createErrorResponse("registrationId is required", 400);
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
        return createErrorResponse("Registration not found", 404, regError);
      }

      // Generate QR code data
      const qrData = JSON.stringify({
        registrationId: registration.id,
        userId: registration.user_id,
        eventId: registration.event_id,
        ticketId: registration.ticket_id,
        timestamp: new Date().toISOString(),
      });

      const badgeData: BadgeData = {
        firstName: registration.user.first_name,
        lastName: registration.user.last_name,
        ticketId: registration.ticket_id,
        eventTitle: registration.event.title,
        eventDate: registration.event.event_date,
        qrData,
      };

      // Generate badge SVG
      const badgeSvg = generateBadgeSvg(badgeData);

      // Store badge in database
      const { error: updateError } = await supabase
        .from("registrations")
        .update({
          badge_generated: true,
          badge_generated_at: new Date().toISOString(),
          qr_data: qrData,
        })
        .eq("id", registrationId);

      if (updateError) {
        console.error("Failed to update registration:", updateError);
      }

      logRequest("generate-badge", "POST", { registrationId, success: true });

      return new Response(badgeSvg, {
        headers: {
          ...corsHeaders,
          "Content-Type": "image/svg+xml",
          "Content-Disposition": `attachment; filename="badge-${registration.ticket_id}.svg"`,
        },
      });
    }

    return createErrorResponse("Method not allowed", 405);
  } catch (error) {
    console.error("Badge generation error:", error);
    return createErrorResponse("Internal server error", 500, error.message);
  }
});

function generateBadgeSvg(data: BadgeData): string {
  return `
    <svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#1e40af;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="400" height="600" fill="url(#bgGradient)" rx="20"/>
      
      <!-- Header -->
      <rect x="20" y="20" width="360" height="80" fill="white" rx="10" opacity="0.95"/>
      <text x="200" y="45" text-anchor="middle" font-family="Arial" font-size="18" font-weight="bold" fill="#1e40af">EXJAM ASSOCIATION</text>
      <text x="200" y="70" text-anchor="middle" font-family="Arial" font-size="14" fill="#6b7280">Ex-Junior Airmen • AFMS Jos</text>
      <text x="200" y="88" text-anchor="middle" font-family="Arial" font-size="12" fill="#9ca3af">Strive to Excel</text>
      
      <!-- Event Info -->
      <rect x="20" y="120" width="360" height="60" fill="white" rx="10" opacity="0.95"/>
      <text x="200" y="145" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="#1e40af">${data.eventTitle}</text>
      <text x="200" y="165" text-anchor="middle" font-family="Arial" font-size="14" fill="#4b5563">${new Date(data.eventDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</text>
      
      <!-- Participant Info -->
      <rect x="20" y="200" width="360" height="120" fill="white" rx="10" opacity="0.95"/>
      <text x="200" y="230" text-anchor="middle" font-family="Arial" font-size="24" font-weight="bold" fill="#1e40af">${data.firstName} ${data.lastName}</text>
      <text x="200" y="255" text-anchor="middle" font-family="Arial" font-size="16" fill="#6b7280">Participant</text>
      <text x="200" y="280" text-anchor="middle" font-family="Arial" font-size="14" fill="#9ca3af">Ticket ID: ${data.ticketId}</text>
      <text x="200" y="300" text-anchor="middle" font-family="Arial" font-size="12" fill="#9ca3af">Please present this badge at the event</text>
      
      <!-- QR Code Placeholder -->
      <rect x="150" y="340" width="100" height="100" fill="white" rx="10"/>
      <text x="200" y="395" text-anchor="middle" font-family="Arial" font-size="12" fill="#6b7280">QR Code</text>
      
      <!-- Footer -->
      <rect x="20" y="460" width="360" height="80" fill="white" rx="10" opacity="0.95"/>
      <text x="200" y="485" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="#1e40af">NAF Conference Centre, Abuja</text>
      <text x="200" y="505" text-anchor="middle" font-family="Arial" font-size="12" fill="#6b7280">November 28-30, 2025</text>
      <text x="200" y="525" text-anchor="middle" font-family="Arial" font-size="12" fill="#9ca3af">info@exjam.org.ng | www.exjamalumni.org</text>
      
      <!-- Security Pattern -->
      <defs>
        <pattern id="security" patternUnits="userSpaceOnUse" width="4" height="4">
          <rect width="4" height="4" fill="none"/>
          <circle cx="2" cy="2" r="0.5" fill="white" opacity="0.1"/>
        </pattern>
      </defs>
      <rect width="400" height="600" fill="url(#security)"/>
    </svg>
  `;
}
