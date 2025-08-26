"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/store/consolidated-auth";
import toast from "react-hot-toast";
import { 
  Mail,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield,
  Clock,
  Key,
  SendHorizontal,
  HelpCircle
} from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function EnhancedForgotPasswordPage() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setFocus,
    watch,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange",
  });

  const emailValue = watch("email");

  // Handle cooldown timer
  React.useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Auto-focus email field
  React.useEffect(() => {
    setFocus("email");
  }, [setFocus]);

  const onSubmit = async (data: ForgotPasswordFormData) => {
    if (cooldown > 0) return;
    
    setIsSubmitting(true);

    try {
      await resetPassword(data.email);
      setIsSuccess(true);
      setCooldown(60); // 60 second cooldown
      toast.success("Password reset link sent! Check your email.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send reset email";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-xl mb-4">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Password Reset</h1>
          <p className="text-gray-600 mt-2">Recover access to your account</p>
        </div>

        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur">
          {!isSuccess ? (
            <>
              <CardHeader className="space-y-1 pb-4">
                <CardTitle>Forgot your password?</CardTitle>
                <CardDescription>
                  Enter your email address and we'll send you a link to reset your password
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        className={`pl-10 h-11 ${errors.email ? 'border-red-500' : ''}`}
                        disabled={isSubmitting || cooldown > 0}
                        {...register("email")}
                      />
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Security Notice */}
                  <Alert className="bg-blue-50 border-blue-200">
                    <Key className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 text-sm">
                      For security reasons, we'll send a password reset link that expires in 1 hour.
                      Make sure you have access to this email address.
                    </AlertDescription>
                  </Alert>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    disabled={isSubmitting || !isValid || cooldown > 0}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending Reset Link...
                      </>
                    ) : cooldown > 0 ? (
                      <>
                        <Clock className="mr-2 h-4 w-4" />
                        Resend in {cooldown}s
                      </>
                    ) : (
                      <>
                        <SendHorizontal className="mr-2 h-4 w-4" />
                        Send Reset Link
                      </>
                    )}
                  </Button>

                  {/* Back to Login */}
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => router.push("/login")}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-green-900">Check Your Email</CardTitle>
                <CardDescription className="mt-2">
                  We've sent a password reset link to:
                  <br />
                  <span className="font-semibold text-gray-900">{emailValue}</span>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <Alert className="bg-green-50 border-green-200">
                  <Mail className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Click the link in your email to create a new password. The link will expire in 1 hour.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <p className="text-center text-sm text-gray-600">
                    Didn't receive the email? Check your spam folder or
                  </p>

                  <Button
                    onClick={() => {
                      setIsSuccess(false);
                      handleSubmit(onSubmit)();
                    }}
                    variant="outline"
                    className="w-full"
                    disabled={cooldown > 0}
                  >
                    {cooldown > 0 ? (
                      <>
                        <Clock className="mr-2 h-4 w-4" />
                        Resend in {cooldown}s
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Resend Reset Email
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => router.push("/login")}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          <CardFooter>
            <div className="w-full pt-4 border-t">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <HelpCircle className="h-4 w-4" />
                <span>Need help?</span>
                <Link href="/contact" className="font-medium text-blue-600 hover:text-blue-800">
                  Contact Support
                </Link>
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* Additional Help Section */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center justify-center w-full">
            <Separator className="w-full max-w-[100px]" />
            <span className="px-3 text-xs text-gray-500 uppercase">Or</span>
            <Separator className="w-full max-w-[100px]" />
          </div>
          
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-600">
              Remember your password?{" "}
              <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-800">
                Sign In
              </Link>
            </p>
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-800">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}

// Add React import for useEffect
import * as React from "react";