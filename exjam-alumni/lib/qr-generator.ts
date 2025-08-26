import QRCode from "qrcode";

export interface QRCodeData {
  ticketId: string;
  eventId?: string;
  userId: string;
  email: string;
  registrationDate: string;
  type: "ticket" | "payment" | "checkin";
}

export interface QRCodeOptions {
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  width?: number;
}

/**
 * Generate QR code data URL for tickets and payments
 */
export async function generateQRCode(
  data: QRCodeData,
  options: QRCodeOptions = {}
): Promise<string> {
  const defaultOptions: QRCodeOptions = {
    errorCorrectionLevel: "M",
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
    width: 200,
  };

  const qrOptions = { ...defaultOptions, ...options };

  // Create structured data for QR code
  const qrData = {
    id: data.ticketId,
    event: data.eventId,
    user: data.userId,
    email: data.email,
    date: data.registrationDate,
    type: data.type,
    timestamp: Date.now(),
  };

  try {
    const dataUrl = await QRCode.toDataURL(JSON.stringify(qrData), qrOptions);
    return dataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Generate QR code as buffer for email attachments
 */
export async function generateQRCodeBuffer(
  data: QRCodeData,
  options: QRCodeOptions = {}
): Promise<Buffer> {
  const defaultOptions: QRCodeOptions = {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 300,
  };

  const qrOptions = { ...defaultOptions, ...options };

  const qrData = {
    id: data.ticketId,
    event: data.eventId,
    user: data.userId,
    email: data.email,
    date: data.registrationDate,
    type: data.type,
    timestamp: Date.now(),
  };

  try {
    const buffer = await QRCode.toBuffer(JSON.stringify(qrData), qrOptions);
    return buffer;
  } catch (error) {
    console.error("Error generating QR code buffer:", error);
    throw new Error("Failed to generate QR code buffer");
  }
}

/**
 * Validate and parse QR code data
 */
export function parseQRCodeData(qrString: string): QRCodeData | null {
  try {
    const parsed = JSON.parse(qrString);

    if (!parsed.id || !parsed.user || !parsed.email || !parsed.type) {
      return null;
    }

    return {
      ticketId: parsed.id,
      eventId: parsed.event,
      userId: parsed.user,
      email: parsed.email,
      registrationDate: parsed.date,
      type: parsed.type,
    };
  } catch (error) {
    console.error("Error parsing QR code data:", error);
    return null;
  }
}
