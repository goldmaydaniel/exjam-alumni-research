import QRCode from "qrcode";

export async function generateTicketNumber(): Promise<string> {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `TKT-${timestamp}-${random}`.toUpperCase();
}

export async function generateQRCode(data: string): Promise<string> {
  try {
    const qrCode = await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    return qrCode;
  } catch (error) {
    console.error("QR Code generation error:", error);
    throw new Error("Failed to generate QR code");
  }
}

export interface TicketData {
  ticketNumber: string;
  eventId: string;
  userId: string;
  eventTitle: string;
  userName: string;
  eventDate: string;
  venue: string;
}

export async function generateTicketQR(ticketData: TicketData): Promise<string> {
  const qrData = JSON.stringify({
    t: ticketData.ticketNumber,
    e: ticketData.eventId,
    u: ticketData.userId,
  });

  return generateQRCode(qrData);
}
