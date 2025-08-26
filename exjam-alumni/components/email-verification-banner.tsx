"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Mail, X, Loader2, CheckCircle } from "lucide-react";

interface EmailVerificationBannerProps {
  email: string;
  verified: boolean;
  onDismiss?: () => void;
}

export default function EmailVerificationBanner({
  email,
  verified,
  onDismiss,
}: EmailVerificationBannerProps) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [dismissed, setDismissed] = useState(false);

  // Don't show if verified or dismissed
  if (verified || dismissed) {
    return null;
  }

  const handleResend = async () => {
    setSending(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSent(true);
        setTimeout(() => setSent(false), 5000); // Reset after 5 seconds
      } else {
        setError(data.error || "Failed to send verification email");
        setTimeout(() => setError(""), 5000); // Clear error after 5 seconds
      }
    } catch (err) {
      setError("Failed to send verification email");
      setTimeout(() => setError(""), 5000);
    } finally {
      setSending(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <Alert className="relative mb-4 border-yellow-200 bg-yellow-50">
      <Mail className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="pr-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-yellow-900">Verify your email address</p>
            <p className="text-sm text-yellow-700">
              Please verify your email ({email}) to access all features.
            </p>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            {sent && (
              <p className="mt-1 flex items-center gap-1 text-sm text-green-600">
                <CheckCircle className="h-3 w-3" />
                Verification email sent! Check your inbox.
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResend}
              disabled={sending || sent}
              className="border-yellow-300 bg-white hover:bg-yellow-100"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Sending...
                </>
              ) : sent ? (
                <>
                  <CheckCircle className="mr-2 h-3 w-3" />
                  Sent!
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-3 w-3" />
                  Resend Email
                </>
              )}
            </Button>
          </div>
        </div>
      </AlertDescription>
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-2 rounded-md p-1 text-yellow-600 hover:bg-yellow-100"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </Alert>
  );
}
