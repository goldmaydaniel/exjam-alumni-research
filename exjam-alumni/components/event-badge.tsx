"use client";

import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Loader2 } from "lucide-react";
import QRCode from "qrcode";
import toast from "react-hot-toast";

interface EventBadgeProps {
  user: {
    fullName: string;
    serviceNumber: string;
    squadron: string;
    email: string;
    photoUrl?: string;
  };
  ticket: {
    ticketNumber: string;
    qrCode?: string;
  };
  event: {
    title: string;
    startDate: string;
    endDate: string;
    venue: string;
  };
}

export function EventBadge({ user, ticket, event }: EventBadgeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  useEffect(() => {
    // Generate QR code
    QRCode.toDataURL(ticket.qrCode || ticket.ticketNumber, {
      width: 150,
      margin: 1,
      color: {
        dark: "#1a365d",
        light: "#ffffff",
      },
    }).then(setQrCodeUrl);
  }, [ticket]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size (3.5" x 2.25" at 96 DPI for display)
    canvas.width = 336;
    canvas.height = 216;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#1e3a8a");
    gradient.addColorStop(1, "#3730a3");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 3;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

    // Logo placeholder (circle with text)
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(35, 35, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1e3a8a";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("EXJAM", 35, 39);

    // Event title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("ExJAM Alumni Association", canvas.width / 2, 30);

    // Event subtitle
    ctx.font = "10px Arial";
    ctx.fillStyle = "#fbbf24";
    ctx.fillText("Research Conference 2025", canvas.width / 2, 45);

    // User photo placeholder or actual photo
    if (user.photoUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.save();
        // Rounded rectangle for photo
        ctx.beginPath();
        ctx.roundRect(15, 60, 60, 75, 5);
        ctx.clip();
        ctx.drawImage(img, 15, 60, 60, 75);
        ctx.restore();

        // Photo border
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(15, 60, 60, 75, 5);
        ctx.stroke();
      };
      img.src = user.photoUrl;
    } else {
      // Photo placeholder
      ctx.fillStyle = "#4a5568";
      ctx.fillRect(15, 60, 60, 75);
      ctx.fillStyle = "#ffffff";
      ctx.font = "10px Arial";
      ctx.textAlign = "center";
      ctx.fillText("PHOTO", 45, 100);
    }

    // Name
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "left";
    ctx.fillText(user.fullName.toUpperCase(), 85, 80);

    // Service details
    ctx.font = "9px Arial";
    ctx.fillStyle = "#fbbf24";
    ctx.fillText(`Service: ${user.serviceNumber}`, 85, 95);
    ctx.fillText(`Squadron: ${user.squadron}`, 85, 110);

    // Ticket number
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 8px Arial";
    ctx.fillText(`Ticket: ${ticket.ticketNumber}`, 85, 125);

    // QR Code
    if (qrCodeUrl) {
      const qrImg = new Image();
      qrImg.onload = () => {
        ctx.drawImage(qrImg, canvas.width - 65, canvas.height - 65, 50, 50);

        // QR label
        ctx.fillStyle = "#ffffff";
        ctx.font = "7px Arial";
        ctx.textAlign = "center";
        ctx.fillText("CHECK-IN", canvas.width - 40, canvas.height - 10);
      };
      qrImg.src = qrCodeUrl;
    }

    // Bottom text
    ctx.fillStyle = "#fbbf24";
    ctx.font = "italic 8px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      "April 15-17, 2025 | Lagos Conference Center",
      canvas.width / 2,
      canvas.height - 10
    );

    // Watermark pattern
    ctx.globalAlpha = 0.03;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px Arial";
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((-45 * Math.PI) / 180);
    for (let i = -200; i < 200; i += 60) {
      for (let j = -200; j < 200; j += 30) {
        ctx.fillText("EXJAM", i, j);
      }
    }
    ctx.restore();
  }, [user, ticket, event, qrCodeUrl]);

  const downloadBadge = async () => {
    if (!canvasRef.current) return;

    setDownloading(true);
    try {
      // Create high-resolution canvas for download
      const downloadCanvas = document.createElement("canvas");
      const downloadCtx = downloadCanvas.getContext("2d");
      if (!downloadCtx) throw new Error("Cannot create canvas context");

      // Set high resolution (3.5" x 2.25" at 300 DPI)
      downloadCanvas.width = 1050;
      downloadCanvas.height = 675;

      // Scale up the rendering
      downloadCtx.scale(3.125, 3.125); // 1050/336 = 3.125

      // Copy the display canvas content
      downloadCtx.drawImage(canvasRef.current, 0, 0);

      // Convert to blob and download
      downloadCanvas.toBlob((blob) => {
        if (!blob) throw new Error("Failed to create image");

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ExJAM-Badge-${ticket.ticketNumber}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success("Badge downloaded successfully!");
      }, "image/png");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download badge");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Your Event Badge</h3>
          <Button onClick={downloadBadge} disabled={downloading} size="sm">
            {downloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download Badge
              </>
            )}
          </Button>
        </div>

        <div className="relative flex justify-center rounded-lg bg-gray-100 p-4">
          <canvas
            ref={canvasRef}
            className="rounded-lg border-2 border-gray-300 shadow-lg"
            style={{ maxWidth: "100%", height: "auto" }}
          />
        </div>

        <div className="space-y-1 text-sm text-muted-foreground">
          <p>• Print on standard badge paper (3.5" × 2.25")</p>
          <p>• Present this badge at the registration desk</p>
          <p>• Keep your badge visible during the event</p>
        </div>
      </div>
    </Card>
  );
}
