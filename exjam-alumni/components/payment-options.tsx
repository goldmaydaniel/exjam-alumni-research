"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, Building2, Copy, CheckCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface PaymentOptionsProps {
  amount: number;
  userEmail: string;
  userId: string;
  registrationId: string;
  onSuccess?: () => void;
}

export function PaymentOptions({
  amount,
  userEmail,
  userId,
  registrationId,
  onSuccess,
}: PaymentOptionsProps) {
  const [loading, setLoading] = useState(false);
  const [bankTransferRef, setBankTransferRef] = useState<string>("");
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({});

  const bankDetails = {
    bankName: process.env.NEXT_PUBLIC_BANK_NAME || "First Bank of Nigeria",
    accountName: process.env.NEXT_PUBLIC_ACCOUNT_NAME || "ExJAM Alumni Association",
    accountNumber: process.env.NEXT_PUBLIC_ACCOUNT_NUMBER || "3123456789",
  };

  const handlePaystackPayment = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId,
          callbackUrl: `${window.location.origin}/api/payment/callback`,
        }),
      });

      const data = await response.json();

      if (data.success && data.data?.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = data.data.authorization_url;
      } else {
        throw new Error(data.error || "Failed to initialize payment");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to initialize payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateBankTransferReference = () => {
    const ref = `EXJAM-${Date.now().toString(36).toUpperCase()}`;
    setBankTransferRef(ref);
    return ref;
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [field]: true });
    toast.success(`${field} copied to clipboard`);
    setTimeout(() => {
      setCopied({ ...copied, [field]: false });
    }, 2000);
  };

  const handleBankTransferConfirmation = async () => {
    if (!bankTransferRef) {
      const ref = generateBankTransferReference();
      toast.success(`Your reference: ${ref}. Please make the transfer and click confirm.`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/payment/bank-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: bankTransferRef,
          amount,
          userId,
          registrationId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Payment recorded! We'll verify and confirm within 24 hours.");
        if (onSuccess) onSuccess();
      } else {
        throw new Error(data.error || "Failed to record payment");
      }
    } catch (error) {
      console.error("Bank transfer error:", error);
      toast.error("Failed to record payment. Please contact support.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Complete Your Payment</CardTitle>
        <CardDescription>Registration Fee: ₦{amount.toLocaleString()}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="paystack" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="paystack" disabled={loading}>
              <CreditCard className="mr-2 h-4 w-4" />
              Card Payment
            </TabsTrigger>
            <TabsTrigger value="transfer" disabled={loading}>
              <Building2 className="mr-2 h-4 w-4" />
              Bank Transfer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paystack" className="space-y-4">
            <Alert>
              <AlertDescription>
                You'll be redirected to Paystack's secure payment page to complete your transaction.
                Accepted cards: Mastercard, Visa, Verve.
              </AlertDescription>
            </Alert>

            <Button onClick={handlePaystackPayment} disabled={loading} className="w-full" size="lg">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay ₦{amount.toLocaleString()} with Card
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">Secured by Paystack</p>
          </TabsContent>

          <TabsContent value="transfer" className="space-y-4">
            <Alert>
              <AlertDescription>
                Transfer the exact amount to the account below and use your unique reference number.
              </AlertDescription>
            </Alert>

            <div className="space-y-3 rounded-lg bg-secondary/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Bank Name:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{bankDetails.bankName}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(bankDetails.bankName, "Bank Name")}
                  >
                    {copied["Bank Name"] ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Account Name:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{bankDetails.accountName}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(bankDetails.accountName, "Account Name")}
                  >
                    {copied["Account Name"] ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Account Number:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{bankDetails.accountNumber}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(bankDetails.accountNumber, "Account Number")}
                  >
                    {copied["Account Number"] ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">₦{amount.toLocaleString()}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(amount.toString(), "Amount")}
                  >
                    {copied["Amount"] ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {bankTransferRef && (
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-sm text-muted-foreground">Reference:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-primary">{bankTransferRef}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(bankTransferRef, "Reference")}
                    >
                      {copied["Reference"] ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleBankTransferConfirmation}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording Payment...
                </>
              ) : bankTransferRef ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  I've Made the Transfer
                </>
              ) : (
                <>
                  <Building2 className="mr-2 h-4 w-4" />
                  Generate Reference & Transfer Details
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Payment will be confirmed within 24 hours
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
