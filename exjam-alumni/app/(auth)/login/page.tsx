"use client";

import { useState, lazy, Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/store/consolidated-auth";
import SocialAuthButtons from "@/components/auth/social-auth-buttons";
import { Separator } from "@/components/ui/separator";
import { Shield, Users, ArrowRight, Mail, Lock, Sparkles, CheckCircle, Star } from "lucide-react";

// Lazy load icon to reduce bundle size
const Loader2 = lazy(() => import("lucide-react").then((mod) => ({ default: mod.Loader2 })));

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { signIn, isLoading, initialize } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  const rememberMe = watch("rememberMe");

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await signIn(data.email, data.password);

      // Store remember me preference
      if (data.rememberMe) {
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberMe");
      }

      toast.success("Welcome back!");

      // Get redirect URL from query params
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");

      // Redirect based on role or to redirect URL
      if (redirect) {
        router.push(decodeURIComponent(redirect));
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 py-20">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-0">
          <div className="absolute right-0 top-0 h-96 w-96 -translate-y-32 translate-x-32 transform rounded-full bg-yellow-500 opacity-10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-96 w-96 -translate-x-32 translate-y-32 transform rounded-full bg-green-500 opacity-10 blur-3xl" />
        </div>

        <div className="container relative z-10 text-center">
          <h1 className="mb-4 text-4xl font-black tracking-tight text-white md:text-6xl">
            Welcome Back
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-xl text-blue-100">
            Sign in to access your alumni profile and connect with fellow Ex-Junior Airmen
          </p>
        </div>
      </section>

      {/* Login Form Section */}
      <section className="container relative z-10 -mt-10 pb-20">
        <div className="mx-auto max-w-md">
          <Card className="overflow-hidden rounded-3xl border-0 bg-white/95 shadow-2xl backdrop-blur-sm">
            <CardHeader className="p-8 pb-6 text-center">
              <CardTitle className="text-2xl font-black text-gray-900">Sign In</CardTitle>
              <CardDescription className="text-gray-600">
                Access your alumni dashboard
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="flex items-center gap-2 text-sm font-bold text-gray-700"
                  >
                    <Mail className="h-4 w-4 text-blue-600" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your alumni email"
                    className="h-12 rounded-xl border-2 border-gray-200 bg-gray-50/50 px-4 text-gray-900 placeholder-gray-500 transition-all duration-300 focus:border-blue-500 focus:bg-white"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm font-medium text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="flex items-center gap-2 text-sm font-bold text-gray-700"
                  >
                    <Lock className="h-4 w-4 text-blue-600" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="h-12 rounded-xl border-2 border-gray-200 bg-gray-50/50 px-4 text-gray-900 placeholder-gray-500 transition-all duration-300 focus:border-blue-500 focus:bg-white"
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-sm font-medium text-red-600">{errors.password.message}</p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="rememberMe"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setValue("rememberMe", !!checked)}
                      className="rounded-md"
                    />
                    <Label
                      htmlFor="rememberMe"
                      className="cursor-pointer text-sm font-medium text-gray-700"
                    >
                      Remember me for 30 days
                    </Label>
                  </div>

                  <Link
                    href="/forgot-password"
                    className="text-sm font-semibold text-blue-600 transition-colors hover:text-blue-800"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="h-14 w-full transform rounded-xl border-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-lg font-bold text-white shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 hover:shadow-2xl"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Suspense
                        fallback={
                          <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        }
                      >
                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      </Suspense>
                      Signing you in...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-3 h-5 w-5" />
                      Sign In Securely
                      <ArrowRight className="ml-3 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-8 space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-sm uppercase">
                    <span className="bg-white px-4 font-semibold text-gray-500">
                      Or continue with
                    </span>
                  </div>
                </div>

                <SocialAuthButtons
                  onSuccess={() => {
                    toast.success("Welcome back!");
                    router.push("/dashboard");
                  }}
                  onError={(error) => {
                    setError(error);
                    toast.error(error);
                  }}
                />
              </div>
            </CardContent>

            <CardFooter className="px-8 pb-8">
              <Link href="/register" className="block w-full">
                <Button
                  variant="outline"
                  className="h-12 w-full rounded-xl border-2 border-blue-300 bg-white font-bold text-blue-700 transition-all duration-300 hover:border-blue-400 hover:bg-blue-100"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Create Profile
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </section>
    </div>
  );
}
