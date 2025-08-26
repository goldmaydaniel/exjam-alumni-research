"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, AlertCircle, User, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/store/consolidated-auth";

interface PaymentData {
  id: string;
  reference: string;
  status: string;
  registration: {
    id: string;
  };
  temporaryTicketId?: string;
}

export default function TemporaryBadgePage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.paymentId) {
      fetchPaymentData(params.paymentId as string);
    }
  }, [params?.paymentId]);

  const fetchPaymentData = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/payment/${paymentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPayment(data);

        // If payment has been verified, redirect to official badge
        if (data.status === "COMPLETED") {
          toast.success("Payment verified! Redirecting to official badge...");
          setTimeout(() => {
            router.push(`/badge/${data.registration.id}`);
          }, 2000);
        }
      } else {
        toast.error("Payment not found");
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Failed to fetch payment:", error);
      toast.error("Failed to load payment details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="container py-8 text-center">
        <h1 className="mb-4 text-2xl font-bold">Payment not found</h1>
        <Button onClick={() => router.push("/dashboard")}>Return to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 py-8 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Temporary Badge</h1>
          <p className="text-muted-foreground">Your registration is being processed</p>
        </div>

        {/* Status Card */}
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/10">
          <CardContent className="pt-6">
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-yellow-500">
                <Clock className="h-8 w-8 text-white" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-yellow-700 dark:text-yellow-400">
                  Awaiting Payment Verification
                </h3>
                <p className="text-muted-foreground">
                  Your bank transfer is being processed. This usually takes 1-2 business days.
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Payment Reference:</strong> {payment.reference}
                  <br />
                  Please ensure you used this reference when making your bank transfer.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardContent className="space-y-4 pt-6">
            <h3 className="text-lg font-semibold">What happens next?</h3>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white">
                  1
                </div>
                <div>
                  <p className="font-medium">Bank Transfer Verification</p>
                  <p className="text-sm text-muted-foreground">
                    Our team will verify your bank transfer within 1-2 business days.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white">
                  2
                </div>
                <div>
                  <p className="font-medium">Email Notification</p>
                  <p className="text-sm text-muted-foreground">
                    You'll receive an email confirmation once payment is verified.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-sm font-semibold text-white">
                  3
                </div>
                <div>
                  <p className="font-medium">Official Badge Generated</p>
                  <p className="text-sm text-muted-foreground">
                    Your official event badge with QR code will be available for download.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-center gap-3">
          <Button onClick={() => router.push("/dashboard")} variant="outline" size="lg">
            Return to Dashboard
          </Button>
          <Button onClick={() => router.push(`/badge/${payment.registration.id}`)} size="lg">
            <User className="mr-2 h-4 w-4" />
            View Current Badge
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Contact Info */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/10">
          <CardContent className="pt-6 text-center">
            <h3 className="mb-2 font-semibold text-blue-700 dark:text-blue-400">Need Help?</h3>
            <p className="text-sm text-muted-foreground">
              If you have any questions about your payment or registration, please contact us at{" "}
              <a href="mailto:info@exjam.org.ng" className="text-blue-600 hover:underline">
                info@exjam.org.ng
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
