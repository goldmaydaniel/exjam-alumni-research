"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CreditCard,
  Banknote,
  Clock,
  CheckCircle2,
  Copy,
  ExternalLink,
  Shield,
  Zap,
  Building2,
  User,
  Calendar,
  MapPin,
  Mail,
  Phone,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/store/consolidated-auth";

interface PaymentData {
  id: string;
  reference: string;
  amount: number;
  status: string;
  paymentMethod: string;
  registration: {
    id: string;
    ticketType: string;
    event: {
      id: string;
      title: string;
      startDate: string;
      endDate: string;
      venue: string;
      price: number;
    };
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };
  };
}

const BANK_DETAILS = {
  bankName: "First Bank of Nigeria",
  accountName: "The EXJAM Association",
  accountNumber: "2011234567",
  sortCode: "011151003",
};

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuthStore();
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<"paystack" | "bank" | null>(null);
  const [processing, setProcessing] = useState(false);

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

  const handlePaystackPayment = async () => {
    if (!payment) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/payment/paystack/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentId: payment.id,
          email: payment.registration.user.email,
          amount: payment.amount * 100, // Paystack expects kobo
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to Paystack
        window.location.href = data.authorizationUrl;
      } else {
        toast.error(data.error || "Failed to initialize payment");
      }
    } catch (error) {
      console.error("Paystack payment error:", error);
      toast.error("Failed to initialize payment");
    } finally {
      setProcessing(false);
    }
  };

  const handleBankTransfer = async () => {
    if (!payment) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/payment/bank-transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentId: payment.id,
          bankDetails: BANK_DETAILS,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Bank transfer instructions generated!");
        // Refresh payment data to show updated status
        fetchPaymentData(payment.id);
      } else {
        toast.error(data.error || "Failed to process bank transfer");
      }
    } catch (error) {
      console.error("Bank transfer error:", error);
      toast.error("Failed to process bank transfer");
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="container py-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-4 text-2xl font-bold">Payment not found</h1>
          <Button onClick={() => router.push("/dashboard")}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Complete Your Registration</h1>
          <p className="text-muted-foreground">
            Choose your preferred payment method to secure your spot
          </p>
        </div>

        {/* Registration Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Registration Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Event</p>
                  <p className="text-lg font-semibold">{payment.registration.event.title}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {new Date(payment.registration.event.startDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {payment.registration.event.venue}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Attendee</p>
                  <p className="font-semibold">
                    {payment.registration.user.firstName} {payment.registration.user.lastName}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {payment.registration.user.email}
                </div>
                {payment.registration.user.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {payment.registration.user.phone}
                  </div>
                )}
                <Badge variant="secondary" className="w-fit">
                  {payment.registration.ticketType} Ticket
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Payment Reference</p>
                <div className="flex items-center gap-2">
                  <code className="rounded bg-muted px-2 py-1 font-mono text-sm">
                    {payment.reference}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(payment.reference)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold text-green-600">
                  ₦{payment.amount.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {payment.status === "PENDING" && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Paystack Payment */}
            <Card className="cursor-pointer border-2 transition-colors hover:border-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-600">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-lg">Pay with Card</p>
                    <p className="text-sm font-normal text-muted-foreground">
                      Instant confirmation via Paystack
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Zap className="h-4 w-4" />
                  <span>Instant verification & badge generation</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Shield className="h-4 w-4" />
                  <span>Secure payment processing</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-purple-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Immediate event access</span>
                </div>

                <Button
                  onClick={handlePaystackPayment}
                  disabled={processing}
                  className="w-full"
                  size="lg"
                >
                  {processing ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pay ₦{payment.amount.toLocaleString()} Now
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Bank Transfer */}
            <Card className="cursor-pointer border-2 transition-colors hover:border-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-600">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-lg">Bank Transfer</p>
                    <p className="text-sm font-normal text-muted-foreground">
                      Transfer to our bank account
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-orange-600">
                  <Clock className="h-4 w-4" />
                  <span>Manual verification (1-2 business days)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Shield className="h-4 w-4" />
                  <span>No additional fees</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-purple-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Temporary badge until verification</span>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    You'll receive bank details and a temporary badge. Final badge generated after
                    payment verification.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={handleBankTransfer}
                  disabled={processing}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  {processing ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Banknote className="mr-2 h-4 w-4" />
                      Get Bank Details
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bank Transfer Instructions (shown after selection) */}
        {payment.status === "BANK_TRANSFER_PENDING" && (
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                <Building2 className="h-5 w-5" />
                Bank Transfer Instructions
              </CardTitle>
              <CardDescription>
                Please transfer ₦{payment.amount.toLocaleString()} to the account below and use your
                payment reference as the narration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 rounded-lg border bg-white p-4 dark:bg-gray-900">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Bank Name:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{BANK_DETAILS.bankName}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(BANK_DETAILS.bankName)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Account Name:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{BANK_DETAILS.accountName}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(BANK_DETAILS.accountName)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Account Number:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-medium">{BANK_DETAILS.accountNumber}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(BANK_DETAILS.accountNumber)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Sort Code:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{BANK_DETAILS.sortCode}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(BANK_DETAILS.sortCode)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-600">Important:</p>
                  <p className="text-sm text-muted-foreground">
                    Use your payment reference <strong>{payment.reference}</strong> as the
                    narration/description when making the transfer.
                  </p>
                  <div className="flex items-center gap-2 rounded bg-yellow-100 p-2 dark:bg-yellow-950/20">
                    <code className="rounded bg-yellow-200 px-2 py-1 text-sm dark:bg-yellow-900">
                      {payment.reference}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(payment.reference)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  After making the transfer, your payment will be verified within 1-2 business days.
                  You'll receive an email notification once verified and your final badge will be
                  generated.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button onClick={() => router.push("/dashboard")} variant="outline">
                  Return to Dashboard
                </Button>
                <Button onClick={() => router.push(`/badge/temporary/${payment.id}`)}>
                  <User className="mr-2 h-4 w-4" />
                  View Temporary Badge
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {payment.status === "COMPLETED" && (
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/10">
            <CardContent className="pt-6">
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">
                    Payment Confirmed!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your registration is complete and your badge is ready.
                  </p>
                </div>
                <Button onClick={() => router.push(`/badge/${payment.registration.id}`)}>
                  <User className="mr-2 h-4 w-4" />
                  View Official Badge
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
