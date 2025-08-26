import { createCanvas, loadImage, registerFont } from "canvas";
import QRCode from "qrcode";

interface BadgeData {
  name: string;
  serviceNumber: string;
  squadron: string;
  ticketNumber: string;
  eventTitle: string;
  eventDate: string;
  photoUrl?: string;
  qrData: string;
  logoUrl?: string;
  siteName?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export class BadgeGenerator {
  static async generateBadge(data: BadgeData): Promise<Buffer> {
    // Create canvas (badge size: 3.5" x 2.25" at 300 DPI)
    const width = 1050;
    const height = 675;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Background gradient with dynamic colors
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, data.primaryColor || "#1a365d");
    gradient.addColorStop(1, data.secondaryColor || "#2c5282");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add decorative border
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // Add inner border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    // Load and draw dynamic logo
    try {
      const logoPath = data.logoUrl || "/exjam-logo.svg";
      const logo = await loadImage(logoPath);
      ctx.drawImage(logo, 50, 50, 120, 120);
    } catch (error) {
      // Draw placeholder if logo not found
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(110, 110, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = data.primaryColor || "#1a365d";
      ctx.font = "bold 30px Arial";
      ctx.textAlign = "center";
      ctx.fillText(data.siteName?.substring(0, 6) || "EXJAM", 110, 120);
    }

    // Event title with dynamic site name
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 42px Arial";
    ctx.textAlign = "center";
    ctx.fillText(data.siteName || "ExJAM Alumni Association", width / 2, 100);

    // Event subtitle
    ctx.font = "28px Arial";
    ctx.fillStyle = "#fbbf24";
    ctx.fillText("Research Conference 2025", width / 2, 140);

    // Draw photo if available
    if (data.photoUrl) {
      try {
        const photo = await loadImage(data.photoUrl);
        // Draw photo with rounded corners
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(50, 200, 200, 250, 10);
        ctx.clip();
        ctx.drawImage(photo, 50, 200, 200, 250);
        ctx.restore();

        // Photo border
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(50, 200, 200, 250, 10);
        ctx.stroke();
      } catch (error) {
        // Draw placeholder
        ctx.fillStyle = "#4a5568";
        ctx.fillRect(50, 200, 200, 250);
        ctx.fillStyle = "#ffffff";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Photo", 150, 325);
      }
    }

    // Name section
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "left";
    ctx.fillText(data.name.toUpperCase(), 280, 250);

    // Service details
    ctx.font = "24px Arial";
    ctx.fillStyle = "#fbbf24";
    ctx.fillText(`Service No: ${data.serviceNumber}`, 280, 290);
    ctx.fillText(`Squadron: ${data.squadron}`, 280, 330);

    // Ticket number
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px Arial";
    ctx.fillText(`Ticket: ${data.ticketNumber}`, 280, 380);

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(data.qrData, {
      width: 150,
      margin: 1,
      color: {
        dark: "#1a365d",
        light: "#ffffff",
      },
    });
    const qrImage = await loadImage(qrCodeDataUrl);
    ctx.drawImage(qrImage, width - 200, height - 200, 150, 150);

    // QR code label
    ctx.fillStyle = "#ffffff";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Check-in QR", width - 125, height - 35);

    // Bottom text
    ctx.fillStyle = "#fbbf24";
    ctx.font = "italic 20px Arial";
    ctx.textAlign = "center";
    ctx.fillText("April 15-17, 2025 | Lagos Conference Center", width / 2, height - 50);

    // Add watermark pattern
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 40px Arial";
    ctx.rotate((-45 * Math.PI) / 180);
    for (let i = -height; i < width; i += 200) {
      for (let j = -width; j < height * 2; j += 100) {
        ctx.fillText("EXJAM", i, j);
      }
    }

    return canvas.toBuffer("image/png");
  }

  static async generateSimpleBadge(data: BadgeData): Promise<string> {
    // Fallback HTML-based badge for client-side generation
    const primaryColor = data.primaryColor || "#1a365d";
    const secondaryColor = data.secondaryColor || "#2c5282";
    const siteName = data.siteName || "ExJAM Alumni Association";

    const html = `
      <div style="width: 350px; height: 225px; background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}); 
                  border: 3px solid #fbbf24; border-radius: 10px; padding: 20px; 
                  font-family: Arial; color: white; position: relative;">
        <div style="text-align: center; margin-bottom: 10px;">
          ${data.logoUrl ? `<img src="${data.logoUrl}" style="width: 40px; height: 40px; object-fit: contain; margin-bottom: 5px;">` : ""}
          <h2 style="margin: 0; color: #fbbf24;">${siteName}</h2>
          <p style="margin: 5px 0;">Research Conference 2025</p>
        </div>
        <div style="display: flex; gap: 20px;">
          ${data.photoUrl ? `<img src="${data.photoUrl}" style="width: 80px; height: 100px; border-radius: 5px; border: 2px solid #fbbf24;">` : ""}
          <div>
            <h3 style="margin: 5px 0;">${data.name}</h3>
            <p style="margin: 3px 0; font-size: 14px; color: #fbbf24;">Service: ${data.serviceNumber}</p>
            <p style="margin: 3px 0; font-size: 14px;">Squadron: ${data.squadron}</p>
            <p style="margin: 3px 0; font-size: 12px;">Ticket: ${data.ticketNumber}</p>
          </div>
        </div>
        <div style="position: absolute; bottom: 10px; right: 10px;">
          <img src="${await QRCode.toDataURL(data.qrData, { width: 60 })}" style="width: 60px; height: 60px;">
        </div>
      </div>
    `;
    return html;
  }
}
