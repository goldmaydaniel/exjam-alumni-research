import { createClient } from "@/lib/supabase/server";
import { BadgeStorageManager } from "@/lib/supabase/storage";

interface BadgeGenerationData {
  registrationId: string;
  userId: string;
  eventId: string;
  ticketNumber: string;
}

export async function generateBadgeForRegistration(data: BadgeGenerationData) {
  try {
    const supabase = await createClient();
    const badgeStorage = new BadgeStorageManager();

    // Get registration details with user and event info
    const { data: registration, error: regError } = await supabase
      .from("Registration")
      .select(
        `
        *,
        user:User!userId(
          id,
          email,
          firstName,
          lastName,
          fullName,
          serviceNumber,
          graduationYear,
          squadron,
          profilePhoto
        ),
        event:Event!eventId(
          id,
          title,
          startDate,
          venue,
          description
        )
      `
      )
      .eq("id", data.registrationId)
      .single();

    if (regError || !registration) {
      throw new Error("Registration not found for badge generation");
    }

    // Generate simple badge data (JSON format for QR code)
    const qrData = JSON.stringify({
      registrationId: data.registrationId,
      userId: data.userId,
      eventId: data.eventId,
      ticketNumber: data.ticketNumber,
      userName:
        registration.user.fullName ||
        `${registration.user.firstName} ${registration.user.lastName}`,
      eventTitle: registration.event.title,
      serviceNumber: registration.user.serviceNumber || "",
      squadron: registration.user.squadron || "",
      verified: true,
      generatedAt: new Date().toISOString(),
    });

    // Generate simple SVG badge
    const badgeSvg = generateSimpleBadgeSVG({
      name:
        registration.user.fullName ||
        `${registration.user.firstName} ${registration.user.lastName}`,
      serviceNumber: registration.user.serviceNumber || "N/A",
      squadron: registration.user.squadron || "Guest",
      ticketNumber: data.ticketNumber,
      eventTitle: registration.event.title,
      eventDate: registration.event.startDate,
      qrData: qrData,
    });

    // Upload badge to Supabase Storage
    const badgeFileName = `badge_${data.registrationId}_${Date.now()}.svg`;
    const badgeUrl = await badgeStorage.uploadBadgeImage(
      badgeFileName,
      Buffer.from(badgeSvg),
      "image/svg+xml"
    );

    // Update registration with badge info
    await supabase
      .from("Registration")
      .update({
        badgeGenerated: true,
        badgeGeneratedAt: new Date().toISOString(),
        badgeUrl: badgeUrl,
        qrData: qrData,
      })
      .eq("id", data.registrationId);

    return {
      success: true,
      badgeUrl: badgeUrl,
      qrData: qrData,
    };
  } catch (error) {
    console.error("Badge generation error:", error);
    throw error;
  }
}

function generateSimpleBadgeSVG(data: {
  name: string;
  serviceNumber: string;
  squadron: string;
  ticketNumber: string;
  eventTitle: string;
  eventDate: string;
  qrData: string;
}): string {
  const eventDate = new Date(data.eventDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
    <svg width="350" height="225" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1a365d;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#2c5282;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="350" height="225" fill="url(#bgGradient)" rx="10"/>
      
      <!-- Border -->
      <rect x="5" y="5" width="340" height="215" fill="none" stroke="#fbbf24" stroke-width="3" rx="8"/>
      
      <!-- Header -->
      <text x="175" y="30" text-anchor="middle" fill="#fbbf24" font-family="Arial, sans-serif" font-size="18" font-weight="bold">
        ExJAM Alumni Association
      </text>
      <text x="175" y="50" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="14">
        ${data.eventTitle}
      </text>
      <text x="175" y="68" text-anchor="middle" fill="#fbbf24" font-family="Arial, sans-serif" font-size="12">
        ${eventDate}
      </text>
      
      <!-- Name -->
      <text x="20" y="100" fill="#ffffff" font-family="Arial, sans-serif" font-size="16" font-weight="bold">
        ${data.name.toUpperCase()}
      </text>
      
      <!-- Details -->
      <text x="20" y="125" fill="#fbbf24" font-family="Arial, sans-serif" font-size="12">
        Service: ${data.serviceNumber}
      </text>
      <text x="20" y="145" fill="#fbbf24" font-family="Arial, sans-serif" font-size="12">
        Squadron: ${data.squadron}
      </text>
      <text x="20" y="165" fill="#ffffff" font-family="Arial, sans-serif" font-size="12" font-weight="bold">
        Ticket: ${data.ticketNumber}
      </text>
      
      <!-- QR Code placeholder -->
      <rect x="270" y="130" width="60" height="60" fill="#ffffff" rx="5"/>
      <text x="300" y="165" text-anchor="middle" fill="#1a365d" font-family="Arial, sans-serif" font-size="10">
        QR CODE
      </text>
      
      <!-- Footer -->
      <text x="175" y="210" text-anchor="middle" fill="#fbbf24" font-family="Arial, sans-serif" font-size="10" font-style="italic">
        Strive to Excel
      </text>
    </svg>
  `.trim();
}
