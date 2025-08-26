// Badge generation service that can work as Edge Function or API route
interface BadgeData {
  firstName: string;
  lastName: string;
  ticketId: string;
  eventTitle: string;
  eventDate: string;
  qrData: string;
  rank?: string;
  serviceNumber?: string;
  graduationYear?: number;
}

export class BadgeService {
  generateBadgeSvg(data: BadgeData): string {
    return `
      <svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#1e40af;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
          </linearGradient>
          <pattern id="security" patternUnits="userSpaceOnUse" width="4" height="4">
            <rect width="4" height="4" fill="none"/>
            <circle cx="2" cy="2" r="0.5" fill="white" opacity="0.1"/>
          </pattern>
        </defs>
        
        <!-- Background -->
        <rect width="400" height="600" fill="url(#bgGradient)" rx="20"/>
        <rect width="400" height="600" fill="url(#security)"/>
        
        <!-- Header -->
        <rect x="20" y="20" width="360" height="80" fill="white" rx="10" opacity="0.95"/>
        <text x="200" y="45" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#1e40af">EXJAM ASSOCIATION</text>
        <text x="200" y="65" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#6b7280">Ex-Junior Airmen • AFMS Jos</text>
        <text x="200" y="83" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#9ca3af">Strive to Excel</text>
        
        <!-- Event Info -->
        <rect x="20" y="120" width="360" height="70" fill="white" rx="10" opacity="0.95"/>
        <text x="200" y="145" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#1e40af">${this.escapeXml(data.eventTitle)}</text>
        <text x="200" y="165" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#4b5563">${this.formatEventDate(data.eventDate)}</text>
        <text x="200" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#9ca3af">NAF Conference Centre, Abuja</text>
        
        <!-- Participant Info -->
        <rect x="20" y="210" width="360" height="140" fill="white" rx="10" opacity="0.95"/>
        <text x="200" y="240" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#1e40af">${this.escapeXml(data.firstName)} ${this.escapeXml(data.lastName)}</text>
        <text x="200" y="265" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#6b7280">Participant</text>
        ${data.rank ? `<text x="200" y="285" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af">${this.escapeXml(data.rank)}</text>` : ""}
        ${data.serviceNumber ? `<text x="200" y="305" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#9ca3af">Service No: ${this.escapeXml(data.serviceNumber)}</text>` : ""}
        ${data.graduationYear ? `<text x="200" y="320" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#9ca3af">Graduated: ${data.graduationYear}</text>` : ""}
        <text x="200" y="335" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#1e40af" font-weight="bold">ID: ${this.escapeXml(data.ticketId)}</text>
        
        <!-- QR Code Placeholder -->
        <rect x="150" y="370" width="100" height="100" fill="white" rx="10" stroke="#1e40af" stroke-width="2"/>
        <text x="200" y="395" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">QR CODE</text>
        <text x="200" y="410" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#9ca3af">Scan at venue</text>
        <text x="200" y="430" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#9ca3af">for check-in</text>
        
        <!-- Instructions -->
        <rect x="20" y="490" width="360" height="60" fill="white" rx="10" opacity="0.95"/>
        <text x="200" y="510" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#dc2626">IMPORTANT</text>
        <text x="200" y="525" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#4b5563">Present this badge at the venue</text>
        <text x="200" y="540" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#4b5563">along with a valid government ID</text>
        
        <!-- Footer -->
        <rect x="20" y="560" width="360" height="25" fill="white" rx="10" opacity="0.8"/>
        <text x="200" y="575" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#6b7280">info@exjam.org.ng | Generated on ${new Date().toLocaleDateString()}</text>
      </svg>
    `;
  }

  generateQRData(registrationData: {
    registrationId: string;
    userId?: string;
    eventId?: string;
    ticketId: string;
  }): string {
    return JSON.stringify({
      ...registrationData,
      timestamp: new Date().toISOString(),
      version: "1.0",
    });
  }

  private escapeXml(unsafe: string): string {
    if (!unsafe) return "";
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  private formatEventDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  }

  // Generate badge with QR code integration
  async generateBadgeWithQR(registrationData: any): Promise<string> {
    const qrData = this.generateQRData({
      registrationId: registrationData.id,
      userId: registrationData.user_id,
      eventId: registrationData.event_id,
      ticketId: registrationData.ticket_id,
    });

    const badgeData: BadgeData = {
      firstName: registrationData.user?.first_name || registrationData.first_name,
      lastName: registrationData.user?.last_name || registrationData.last_name,
      ticketId: registrationData.ticket_id,
      eventTitle: registrationData.event?.title || "EXJAM PG Conference 2025",
      eventDate: registrationData.event?.event_date || "2025-11-28",
      qrData,
      rank: registrationData.user?.rank || registrationData.rank,
      serviceNumber: registrationData.user?.service_number || registrationData.service_number,
      graduationYear: registrationData.user?.graduation_year || registrationData.graduation_year,
    };

    return this.generateBadgeSvg(badgeData);
  }

  // Generate badge URL for downloads
  generateBadgeUrl(registrationId: string, baseUrl: string): string {
    return `${baseUrl}/api/badge/${registrationId}/download`;
  }

  // Generate a simple badge without QR for testing
  generateTestBadge(): string {
    const testData: BadgeData = {
      firstName: "John",
      lastName: "Doe",
      ticketId: "EXJAM2025-TEST",
      eventTitle: "PG Conference 2025 - Maiden Flight",
      eventDate: "2025-11-28",
      qrData: JSON.stringify({ test: true, timestamp: new Date().toISOString() }),
      rank: "Ex-Cadet",
      serviceNumber: "12345",
      graduationYear: 2020,
    };

    return this.generateBadgeSvg(testData);
  }
}
