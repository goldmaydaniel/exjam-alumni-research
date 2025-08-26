"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/store/consolidated-auth";
import { formSchemas, useFormValidation } from "@/lib/validation-utils";
import { useFeedback } from "@/components/ui/feedback-system";
import { EnhancedForm, FormField, FormActions } from "@/components/ui/enhanced-form";
import { ErrorBoundary, FormErrorBoundary } from "@/components/error-boundary";
import { ErrorHandler } from "@/lib/error-handling";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initialValues = {
  email: "",
  password: "",
  rememberMe: false,
};

export default function EnhancedLoginPage() {
  const router = useRouter();
  const { signIn, isLoading, initialize } = useAuth();
  const { showSuccess, showError, showWarning } = useFeedback();
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  const {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    setTouchedField,
    handleSubmit,
    reset,
    isValid,
  } = useFormValidation(formSchemas.login, initialValues);

  // Initialize auth on mount
  useEffect(() => {
    initialize();

    // Check if user was previously logged in
    const rememberMe = localStorage.getItem("rememberMe");
    if (rememberMe) {
      setValue("rememberMe", true);
      showWarning("You have a saved login session", {
        action: {
          label: "Clear",
          onClick: () => {
            localStorage.removeItem("rememberMe");
            setValue("rememberMe", false);
          },
        },
      });
    }

    // Check for rate limiting
    const attempts = parseInt(localStorage.getItem("loginAttempts") || "0");
    const lastAttempt = parseInt(localStorage.getItem("lastLoginAttempt") || "0");
    const now = Date.now();

    // Reset attempts after 15 minutes
    if (now - lastAttempt > 15 * 60 * 1000) {
      localStorage.removeItem("loginAttempts");
      localStorage.removeItem("lastLoginAttempt");
      setLoginAttempts(0);
    } else {
      setLoginAttempts(attempts);
      if (attempts >= 5) {
        setIsBlocked(true);
        const timeLeft = Math.ceil((15 * 60 * 1000 - (now - lastAttempt)) / 60000);
        showError(`Too many failed attempts. Please wait ${timeLeft} minutes before trying again.`);
      }
    }
  }, [initialize, setValue, showWarning, showError]);

  const onSubmit = handleSubmit(async (data) => {
    if (isBlocked) {
      showError("Account temporarily blocked. Please wait before trying again.");
      return;
    }

    try {
      const result = await ErrorHandler.withRetry(
        async () => {
          const signInResult = await signIn(data.email, data.password);
          if (signInResult.error) {
            throw new Error(signInResult.error.message || "Login failed");
          }
          return signInResult;
        },
        {
          maxAttempts: 2,
          delay: 1000,
          onRetry: (attempt, error) => {
            console.log(`Login attempt ${attempt} failed:`, error);
          },
        }
      );

      // Clear login attempts on success
      localStorage.removeItem("loginAttempts");
      localStorage.removeItem("lastLoginAttempt");
      setLoginAttempts(0);

      // Store remember me preference
      if (data.rememberMe) {
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberMe");
      }

      showSuccess("Welcome back!", {
        action: {
          label: "Go to Dashboard",
          onClick: () => router.push("/dashboard"),
        },
      });

      // Get redirect URL from query params
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");

      // Redirect based on role or to redirect URL
      if (redirect) {
        router.push(decodeURIComponent(redirect));
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      // Track failed attempts
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      localStorage.setItem("loginAttempts", newAttempts.toString());
      localStorage.setItem("lastLoginAttempt", Date.now().toString());

      if (newAttempts >= 5) {
        setIsBlocked(true);
        showError(
          "Too many failed attempts. Your account has been temporarily blocked for 15 minutes."
        );
        return;
      }

      // Enhanced error handling with specific messages
      let errorMessage = "Login failed";

      if (error instanceof Error) {
        if (
          error.message.toLowerCase().includes("invalid") ||
          error.message.toLowerCase().includes("incorrect")
        ) {
          errorMessage = `Invalid email or password. ${5 - newAttempts} attempts remaining.`;
        } else if (error.message.toLowerCase().includes("not found")) {
          errorMessage = "Account not found. Please register first.";
        } else if (error.message.toLowerCase().includes("suspended")) {
          errorMessage = "Your account has been suspended. Please contact support.";
        } else if (error.message.toLowerCase().includes("verify")) {
          errorMessage = "Please verify your email address before signing in.";
        } else {
          errorMessage = error.message;
        }
      }

      ErrorHandler.handle(error, {
        context: "User Login",
        showToast: false, // We'll show our own custom error
      });

      showError(errorMessage, {
        action:
          newAttempts >= 3
            ? {
                label: "Reset Password",
                onClick: () => router.push("/forgot-password"),
              }
            : undefined,
      });
    }
  });

  const handleForgotPassword = () => {
    if (values.email && !errors.email) {
      // Pre-fill email on forgot password page
      router.push(`/forgot-password?email=${encodeURIComponent(values.email)}`);
    } else {
      router.push("/forgot-password");
    }
  };

  const handleSocialLogin = async (provider: string) => {
    try {
      showWarning(`Redirecting to ${provider}...`);
      // Social login logic would go here
      // For now, just show a placeholder
      showError(`${provider} login is not yet configured. Please use email/password login.`);
    } catch (error) {
      ErrorHandler.handle(error, {
        context: `${provider} Social Login`,
      });
    }
  };

  return (
    <ErrorBoundary fallbackTitle="Login Error">
      <div className="container flex min-h-[80vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Alumni Sign In</CardTitle>
            <CardDescription>
              Sign in to access your alumni profile and connect with fellow EXJAM members
            </CardDescription>
          </CardHeader>

          <CardContent>
            <FormErrorBoundary>
              <EnhancedForm
                onSubmit={onSubmit}
                loading={isSubmitting || isLoading}
                disabled={isBlocked}
                className="space-y-4"
              >
                <FormField
                  label="Email Address"
                  name="email"
                  type="email"
                  value={values.email}
                  onChange={setValue}
                  onBlur={setTouchedField}
                  error={errors.email}
                  touched={touched.email}
                  placeholder="john.doe@example.com"
                  required
                  autoComplete="email"
                  helper="Enter the email address associated with your alumni account"
                />

                <FormField
                  label="Password"
                  name="password"
                  type="password"
                  value={values.password}
                  onChange={setValue}
                  onBlur={setTouchedField}
                  error={errors.password}
                  touched={touched.password}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  helper={
                    loginAttempts > 0
                      ? `${5 - loginAttempts} attempts remaining before temporary block`
                      : "Enter your account password"
                  }
                />

                <FormField
                  label="Keep me signed in for 30 days"
                  name="rememberMe"
                  type="checkbox"
                  value={values.rememberMe}
                  onChange={setValue}
                  onBlur={setTouchedField}
                  helper="Only check this on your personal device"
                />

                <FormActions
                  submitLabel={isBlocked ? "Account Blocked" : "Sign In"}
                  loading={isSubmitting || isLoading}
                  disabled={isBlocked || !isValid}
                  showCancel={false}
                  additional={
                    <div className="text-sm">
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  }
                />
              </EnhancedForm>
            </FormErrorBoundary>

            {/* Social Login Options */}
            <div className="mt-6 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSocialLogin("Google")}
                  disabled={isBlocked}
                  className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-500 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="ml-2">Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialLogin("LinkedIn")}
                  disabled={isBlocked}
                  className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-500 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  <span className="ml-2">LinkedIn</span>
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3">
            <Link href="/register" className="block w-full">
              <button className="w-full rounded-md border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100">
                Create Profile
              </button>
            </Link>

            {isBlocked && (
              <div className="w-full rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-center text-sm font-semibold text-red-900">
                  Account Temporarily Blocked
                </p>
                <p className="mt-1 text-center text-xs text-red-700">
                  Please wait 15 minutes before trying again, or reset your password
                </p>
                <button
                  onClick={() => router.push("/forgot-password")}
                  className="mt-2 w-full rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                >
                  Reset Password
                </button>
              </div>
            )}

            <div className="text-center">
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 hover:underline">
                ← Back to homepage
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </ErrorBoundary>
  );
}
