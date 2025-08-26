import QRCode from "qrcode";

export interface BadgeData {
  userId: string;
  eventId: string;
  registrationId: string;
  displayName: string;
  title?: string;
  company?: string;
  badgeType: "attendee" | "speaker" | "vip" | "organizer" | "sponsor";
  email?: string;
  profilePhoto?: string;
}

export interface QRCodeData {
  userId: string;
  eventId: string;
  registrationId: string;
  badgeId: string;
  timestamp: string;
  checksum: string; // For verification
}

export interface BadgeTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
  elements: BadgeElement[];
}

export interface BadgeElement {
  id: string;
  type: "text" | "image" | "qr_code" | "logo" | "shape";
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  content?: string;
  dynamicField?: keyof BadgeData;
  style: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
    textAlign?: "left" | "center" | "right";
  };
}

export class BadgeGenerator {
  /**
   * Generate QR code data string with verification
   */
  static generateQRCodeData(badgeData: BadgeData, badgeId: string): string {
    const qrData: QRCodeData = {
      userId: badgeData.userId,
      eventId: badgeData.eventId,
      registrationId: badgeData.registrationId,
      badgeId,
      timestamp: new Date().toISOString(),
      checksum: this.generateChecksum(badgeData, badgeId),
    };

    return JSON.stringify(qrData);
  }

  /**
   * Generate checksum for QR code verification
   */
  private static generateChecksum(badgeData: BadgeData, badgeId: string): string {
    const data = `${badgeData.userId}-${badgeData.eventId}-${badgeData.registrationId}-${badgeId}`;
    // Simple checksum - in production, use crypto.createHash
    return btoa(data).slice(0, 8);
  }

  /**
   * Verify QR code data integrity
   */
  static verifyQRCodeData(qrDataString: string): {
    valid: boolean;
    data?: QRCodeData;
    error?: string;
  } {
    try {
      const qrData: QRCodeData = JSON.parse(qrDataString);

      // Verify required fields
      if (!qrData.userId || !qrData.eventId || !qrData.badgeId || !qrData.checksum) {
        return { valid: false, error: "Missing required fields" };
      }

      // Verify checksum
      const expectedChecksum = this.generateChecksum(
        {
          userId: qrData.userId,
          eventId: qrData.eventId,
          registrationId: qrData.registrationId,
        } as BadgeData,
        qrData.badgeId
      );

      if (qrData.checksum !== expectedChecksum) {
        return { valid: false, error: "Invalid checksum" };
      }

      return { valid: true, data: qrData };
    } catch (error) {
      return { valid: false, error: "Invalid QR code format" };
    }
  }

  /**
   * Generate QR code image as data URL
   */
  static async generateQRCodeImage(qrData: string): Promise<string> {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "M",
      });
      return qrCodeDataURL;
    } catch (error) {
      console.error("QR code generation error:", error);
      throw new Error("Failed to generate QR code");
    }
  }

  /**
   * Create badge HTML for rendering/printing
   */
  static generateBadgeHTML(
    badgeData: BadgeData,
    template: BadgeTemplate,
    qrCodeDataURL: string
  ): string {
    const elements = template.elements
      .map((element) => {
        let content = "";

        // Determine content based on element type
        if (element.type === "qr_code") {
          content = `<img src="${qrCodeDataURL}" style="width: 100%; height: 100%; object-fit: contain;" alt="QR Code" />`;
        } else if (element.type === "logo" && element.content) {
          content = `<img src="${element.content}" style="width: 100%; height: 100%; object-fit: contain; border-radius: ${element.style.borderRadius || 0}px;" alt="Logo" />`;
        } else if (
          element.type === "image" &&
          element.dynamicField === "profilePhoto" &&
          badgeData.profilePhoto
        ) {
          content = `<img src="${badgeData.profilePhoto}" style="width: 100%; height: 100%; object-fit: cover; border-radius: ${element.style.borderRadius || 0}px;" alt="Profile" />`;
        } else if (element.type === "text") {
          if (element.dynamicField) {
            content = String(badgeData[element.dynamicField] || "");
          } else {
            content = element.content || "";
          }
        }

        return `
        <div style="
          position: absolute;
          left: ${element.x}px;
          top: ${element.y}px;
          width: ${element.width}px;
          height: ${element.height}px;
          z-index: ${element.zIndex};
          font-size: ${element.style.fontSize || 16}px;
          font-family: ${element.style.fontFamily || "Arial, sans-serif"};
          font-weight: ${element.style.fontWeight || "normal"};
          color: ${element.style.color || "#000000"};
          background-color: ${element.style.backgroundColor || "transparent"};
          border-radius: ${element.style.borderRadius || 0}px;
          text-align: ${element.style.textAlign || "left"};
          display: flex;
          align-items: center;
          justify-content: ${element.style.textAlign === "center" ? "center" : element.style.textAlign === "right" ? "flex-end" : "flex-start"};
          overflow: hidden;
          word-wrap: break-word;
        ">
          ${content}
        </div>
      `;
      })
      .join("");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Badge - ${badgeData.displayName}</title>
        <style>
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
          .badge { 
            position: relative;
            width: ${template.width}px;
            height: ${template.height}px;
            background-color: ${template.backgroundColor};
            border: 1px solid #ccc;
            margin: 0 auto;
            page-break-inside: avoid;
          }
          @media print {
            body { padding: 0; }
            .badge { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="badge">
          ${elements}
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Default badge template with dynamic logo support
   */
  static getDefaultTemplate(
    logoUrl?: string,
    siteName?: string,
    primaryColor?: string
  ): BadgeTemplate {
    return {
      id: "default",
      name: "Default Event Badge",
      width: 400,
      height: 600,
      backgroundColor: "#ffffff",
      elements: [
        // Logo/Header area
        {
          id: "header",
          type: "shape",
          x: 0,
          y: 0,
          width: 400,
          height: 80,
          zIndex: 1,
          style: {
            backgroundColor: primaryColor || "#1e40af",
          },
        },
        // Organization Logo
        {
          id: "org-logo",
          type: "logo",
          x: 20,
          y: 10,
          width: 60,
          height: 60,
          zIndex: 2,
          content: logoUrl || "/exjam-logo.svg",
          style: {
            backgroundColor: "#ffffff",
            borderRadius: 8,
          },
        },
        // Event title
        {
          id: "event-title",
          type: "text",
          x: 100,
          y: 15,
          width: 280,
          height: 50,
          zIndex: 2,
          content: `${siteName || "ExJAM Alumni"} Event`,
          style: {
            fontSize: 20,
            fontWeight: "bold",
            color: "#ffffff",
            textAlign: "center",
          },
        },
        // Profile photo
        {
          id: "photo",
          type: "image",
          x: 150,
          y: 100,
          width: 100,
          height: 100,
          zIndex: 2,
          dynamicField: "profilePhoto",
          style: {
            borderRadius: 50,
            backgroundColor: "#f3f4f6",
          },
        },
        // Name
        {
          id: "name",
          type: "text",
          x: 20,
          y: 220,
          width: 360,
          height: 40,
          zIndex: 2,
          dynamicField: "displayName",
          style: {
            fontSize: 28,
            fontWeight: "bold",
            color: "#1f2937",
            textAlign: "center",
          },
        },
        // Title
        {
          id: "title",
          type: "text",
          x: 20,
          y: 270,
          width: 360,
          height: 30,
          zIndex: 2,
          dynamicField: "title",
          style: {
            fontSize: 18,
            color: "#6b7280",
            textAlign: "center",
          },
        },
        // Company
        {
          id: "company",
          type: "text",
          x: 20,
          y: 310,
          width: 360,
          height: 30,
          zIndex: 2,
          dynamicField: "company",
          style: {
            fontSize: 16,
            color: "#6b7280",
            textAlign: "center",
          },
        },
        // Badge type
        {
          id: "badge-type",
          type: "text",
          x: 20,
          y: 360,
          width: 360,
          height: 30,
          zIndex: 2,
          dynamicField: "badgeType",
          style: {
            fontSize: 14,
            fontWeight: "bold",
            color: "#059669",
            textAlign: "center",
          },
        },
        // QR Code
        {
          id: "qr-code",
          type: "qr_code",
          x: 150,
          y: 420,
          width: 100,
          height: 100,
          zIndex: 2,
          style: {
            backgroundColor: "#ffffff",
          },
        },
        // Footer
        {
          id: "footer",
          type: "text",
          x: 20,
          y: 540,
          width: 360,
          height: 40,
          zIndex: 2,
          content: "Scan QR code for check-in",
          style: {
            fontSize: 12,
            color: "#9ca3af",
            textAlign: "center",
          },
        },
      ],
    };
  }
}
