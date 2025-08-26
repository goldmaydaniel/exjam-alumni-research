"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Download,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
  QrCode,
  Mail,
} from "lucide-react";

interface BadgeDownloadProps {
  registrationId: string;
  registration?: {
    id: string;
    ticket_id: string;
    payment_status: string;
    badge_generated: boolean;
    confirmation_email_sent: boolean;
    event: {
      title: string;
      event_date: string;
    };
    user: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

export default function BadgeDownload({ registrationId, registration }: BadgeDownloadProps) {
  const [downloading, setDownloading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);

    try {
      const response = await fetch(`/api/badge/${registrationId}/download`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to download badge");
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `EXJAM-Badge-${registration?.ticket_id || registrationId}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess("Badge downloaded successfully!");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const handleSendConfirmationEmail = async () => {
    setSendingEmail(true);
    setError(null);

    try {
      const response = await fetch("/api/notifications/send", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registrationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send email");
      }

      setSuccess("Confirmation email sent successfully!");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Email send failed");
    } finally {
      setSendingEmail(false);
    }
  };

  const canDownload = registration?.payment_status === "paid";
  const eventDate = registration?.event?.event_date
    ? new Date(registration.event.event_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "TBD";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Event Badge
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {registration && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Event:</span>
              <span className="text-sm">{registration.event.title}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Date:</span>
              <span className="text-sm">{eventDate}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Ticket ID:</span>
              <Badge variant="outline">{registration.ticket_id}</Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Payment Status:</span>
              <Badge variant={registration.payment_status === "paid" ? "default" : "secondary"}>
                {registration.payment_status}
              </Badge>
            </div>

            {registration.badge_generated && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                Badge generated
              </div>
            )}
          </div>
        )}

        {/* Payment Status Alert */}
        {registration?.payment_status !== "paid" && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your payment is {registration?.payment_status || "pending"}. Badge download will be
              available once payment is confirmed.
            </AlertDescription>
          </Alert>
        )}

        {/* Success/Error Messages */}
        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            onClick={handleDownload}
            disabled={!canDownload || downloading}
            className="w-full"
          >
            {downloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download Badge
          </Button>

          {canDownload && (
            <Button
              onClick={handleSendConfirmationEmail}
              variant="outline"
              disabled={sendingEmail}
              className="w-full"
            >
              {sendingEmail ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              {registration?.confirmation_email_sent ? "Resend" : "Send"} Confirmation Email
            </Button>
          )}
        </div>

        {/* Instructions */}
        <div className="rounded-lg bg-blue-50 p-4">
          <h4 className="mb-2 font-medium text-blue-900">Badge Instructions:</h4>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Download and save your badge to your device</li>
            <li>• Print a physical copy or show the digital version</li>
            <li>• Bring your badge and a valid ID to the event</li>
            <li>• QR code will be scanned for quick check-in</li>
          </ul>
        </div>

        {/* Badge Preview (if available) */}
        {canDownload && (
          <div className="text-center">
            <img
              src={`/api/badge/${registrationId}`}
              alt="Event Badge Preview"
              className="mx-auto h-auto max-w-full rounded-lg border shadow-sm"
              style={{ maxHeight: "300px" }}
              onError={(e) => {
                // Hide image if it fails to load
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
