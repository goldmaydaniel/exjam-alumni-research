"use client";

import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/store/consolidated-auth";
import { 
  Shield, 
  Users, 
  ArrowRight, 
  Mail, 
  Lock,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  UserPlus,
  KeyRound
} from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function ImprovedLoginPage() {
  const router = useRouter();
  const { signIn, isLoading: authLoading, initialize, error: authError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Initialize auth on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
    setFocus,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
    mode: "onChange",
  });

  const rememberMe = watch("rememberMe");

  // Auto-focus email field on mount
  useEffect(() => {
    setFocus("email");
  }, [setFocus]);

  const onSubmit = async (data: LoginFormData) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);

    try {
      await signIn(data.email, data.password);

      // Store remember me preference
      if (data.rememberMe) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("rememberedEmail", data.email);
      } else {
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("rememberedEmail");
      }

      setLoginSuccess(true);
      toast.success("Login successful! Redirecting...");

      // Get redirect URL from query params
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");

      // Small delay for success animation
      setTimeout(() => {
        if (redirect) {
          router.push(decodeURIComponent(redirect));
        } else {
          router.push("/dashboard");
        }
      }, 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed. Please check your credentials.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load remembered email
  useEffect(() => {
    const remembered = localStorage.getItem("rememberedEmail");
    if (remembered) {
      setValue("email", remembered);
      setValue("rememberMe", true);
      setFocus("password");
    }
  }, [setValue, setFocus]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-xl mb-4">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to your ExJAM Alumni account</p>
        </div>

        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Auth Error Display */}
              {authError && (
                <Alert variant="destructive" className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>
              )}

              {/* Success Message */}
              {loginSuccess && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Login successful! Redirecting to your dashboard...
                  </AlertDescription>
                </Alert>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    className={`pl-10 h-11 ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                    disabled={isSubmitting || loginSuccess}
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

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Link 
                    href="/forgot-password" 
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className={`pl-10 pr-10 h-11 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                    disabled={isSubmitting || loginSuccess}
                    {...register("password")}
                  />
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setValue("rememberMe", !!checked)}
                  disabled={isSubmitting || loginSuccess}
                />
                <label
                  htmlFor="rememberMe"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Remember me for 30 days
                </label>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isSubmitting || !isValid || loginSuccess || authLoading}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : loginSuccess ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Success! Redirecting...
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Social Login Options */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-11"
                disabled={isSubmitting || loginSuccess}
                onClick={() => toast.info("Google login coming soon!")}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
              <Button 
                variant="outline" 
                className="h-11"
                disabled={isSubmitting || loginSuccess}
                onClick={() => toast.info("Microsoft login coming soon!")}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#F25022" d="M11.4 11.4H0V0h11.4v11.4z" />
                  <path fill="#7FBA00" d="M24 11.4H12.6V0H24v11.4z" />
                  <path fill="#00A4EF" d="M11.4 24H0V12.6h11.4V24z" />
                  <path fill="#FFB900" d="M24 24H12.6V12.6H24V24z" />
                </svg>
                Microsoft
              </Button>
            </div>
          </CardContent>

          <CardFooter>
            <div className="w-full">
              <Separator className="mb-4" />
              <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-blue-100 p-2">
                    <UserPlus className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">New to ExJAM Alumni?</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Join our growing community of Ex-Junior Airmen
                    </p>
                    <Link href="/register">
                      <Button 
                        variant="outline" 
                        className="mt-3 w-full border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Create Your Alumni Profile
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* Footer Links */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <Link href="/about" className="hover:text-gray-900">About</Link>
          <span className="mx-2">•</span>
          <Link href="/contact" className="hover:text-gray-900">Contact</Link>
          <span className="mx-2">•</span>
          <Link href="/privacy" className="hover:text-gray-900">Privacy</Link>
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