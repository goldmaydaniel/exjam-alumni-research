"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/store/consolidated-auth";
import { 
  Mail, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  RefreshCw, 
  ArrowRight,
  Shield,
  Clock
} from "lucide-react";
import toast from "react-hot-toast";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "success" | "error">("pending");
  const [errorMessage, setErrorMessage] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Auto-verify if token is present in URL
  useEffect(() => {
    const token = searchParams.get("token");
    const type = searchParams.get("type");
    
    if (token && type === "email") {
      verifyEmailWithToken(token);
    } else if (user?.emailVerified) {
      setVerificationStatus("success");
    }
  }, [searchParams, user]);

  // Cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const verifyEmailWithToken = async (token: string) => {
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setVerificationStatus("success");
        toast.success("Email verified successfully!");
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      } else {
        setVerificationStatus("error");
        setErrorMessage(data.error || "Verification failed");
        toast.error(data.error || "Email verification failed");
      }
    } catch (error) {
      setVerificationStatus("error");
      setErrorMessage("An error occurred during verification");
      toast.error("Failed to verify email. Please try again.");
    }
  };

  const resendVerificationEmail = async () => {
    if (!user?.email || resendCooldown > 0) return;
    
    setIsResending(true);
    
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Verification email sent! Please check your inbox.");
        setResendCooldown(60); // 60 second cooldown
      } else {
        toast.error(data.error || "Failed to send verification email");
      }
    } catch (error) {
      toast.error("Failed to resend verification email");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-xl mb-4">
            <Shield className="w-10 h-10 text-white" />
          </div>
        </div>

        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur">
          <CardHeader className="text-center pb-4">
            {verificationStatus === "pending" && (
              <>
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle>Verify Your Email</CardTitle>
                <CardDescription>
                  We've sent a verification link to your email address
                </CardDescription>
              </>
            )}
            
            {verificationStatus === "success" && (
              <>
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-green-900">Email Verified!</CardTitle>
                <CardDescription>
                  Your email has been successfully verified
                </CardDescription>
              </>
            )}
            
            {verificationStatus === "error" && (
              <>
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle className="text-red-900">Verification Failed</CardTitle>
                <CardDescription>
                  {errorMessage || "We couldn't verify your email"}
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {verificationStatus === "pending" && (
              <>
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
                
                <Alert className="bg-blue-50 border-blue-200">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Check your email inbox and click the verification link to activate your account.
                    The link will expire in 24 hours.
                  </AlertDescription>
                </Alert>

                <div className="text-center space-y-3">
                  <p className="text-sm text-gray-600">
                    Didn't receive the email? Check your spam folder or
                  </p>
                  
                  <Button
                    onClick={resendVerificationEmail}
                    variant="outline"
                    disabled={isResending || resendCooldown > 0}
                    className="w-full"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : resendCooldown > 0 ? (
                      <>
                        <Clock className="mr-2 h-4 w-4" />
                        Resend in {resendCooldown}s
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Resend Verification Email
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}

            {verificationStatus === "success" && (
              <>
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Your account is now active. You can access all features of your ExJAM Alumni account.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <Button 
                    onClick={() => router.push("/dashboard")}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  
                  <p className="text-center text-sm text-gray-600">
                    Redirecting automatically in a few seconds...
                  </p>
                </div>
              </>
            )}

            {verificationStatus === "error" && (
              <>
                <Alert variant="destructive" className="bg-red-50 border-red-200">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    The verification link may have expired or is invalid. Please request a new one.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <Button
                    onClick={resendVerificationEmail}
                    disabled={isResending || resendCooldown > 0}
                    className="w-full"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : resendCooldown > 0 ? (
                      <>
                        <Clock className="mr-2 h-4 w-4" />
                        Resend in {resendCooldown}s
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send New Verification Email
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => router.push("/login")}
                    className="w-full"
                  >
                    Back to Login
                  </Button>
                </div>
              </>
            )}

            {/* Help Section */}
            <div className="pt-4 border-t">
              <p className="text-center text-sm text-gray-600">
                Having trouble?{" "}
                <a href="/contact" className="text-blue-600 hover:text-blue-800 font-medium">
                  Contact Support
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}