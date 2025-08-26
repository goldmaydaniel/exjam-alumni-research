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
import { PasswordStrength } from "@/components/auth/password-strength";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/store/consolidated-auth";
import { 
  Shield,
  Mail,
  Lock,
  User,
  Phone,
  Building,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  UserCheck,
  Briefcase,
  GraduationCap,
  MapPin
} from "lucide-react";

const registrationSchema = z.object({
  // Step 1: Account
  email: z.string().email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
  
  // Step 2: Personal
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  phone: z.string().optional(),
  
  // Step 3: Alumni Info
  graduationYear: z.string().optional(),
  squadron: z.string().optional(),
  chapter: z.string().optional(),
  currentLocation: z.string().optional(),
  
  // Step 4: Professional
  currentOccupation: z.string().optional(),
  company: z.string().optional(),
  
  // Terms
  termsAccepted: z.boolean(),
  marketingConsent: z.boolean().default(false),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

const steps = [
  { id: 1, title: "Account", icon: Mail },
  { id: 2, title: "Personal", icon: User },
  { id: 3, title: "Alumni Info", icon: GraduationCap },
  { id: 4, title: "Professional", icon: Briefcase },
];

export default function EnhancedRegistrationPage() {
  const router = useRouter();
  const { signUp, isLoading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    trigger,
    setFocus,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      marketingConsent: false,
      termsAccepted: false,
    },
    mode: "onChange",
  });

  const watchedFields = watch();
  const termsAccepted = watch("termsAccepted");

  // Auto-focus first field of current step
  useEffect(() => {
    const focusField = {
      1: "email",
      2: "firstName",
      3: "graduationYear",
      4: "currentOccupation",
    }[currentStep];
    
    if (focusField) {
      setTimeout(() => setFocus(focusField as any), 100);
    }
  }, [currentStep, setFocus]);

  const validateStep = async (step: number) => {
    const stepFields = {
      1: ["email", "password", "confirmPassword"],
      2: ["firstName", "lastName"],
      3: [], // All optional
      4: [], // All optional
    }[step] || [];

    if (stepFields.length === 0) return true;
    
    const result = await trigger(stepFields as any);
    return result;
  };

  const nextStep = async () => {
    const isValid = await validateStep(currentStep);
    if (!isValid) {
      toast.error("Please fix the errors before continuing");
      return;
    }
    
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: RegistrationFormData) => {
    if (!termsAccepted) {
      toast.error("Please accept the terms and conditions");
      return;
    }

    if (passwordStrength < 50) {
      toast.error("Please choose a stronger password");
      return;
    }

    setIsSubmitting(true);

    try {
      // Sign up with Supabase
      await signUp(data.email, data.password, {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        graduationYear: data.graduationYear,
        squadron: data.squadron,
        chapter: data.chapter,
        currentLocation: data.currentLocation,
        currentOccupation: data.currentOccupation,
        company: data.company,
        marketingConsent: data.marketingConsent,
      });

      setRegistrationSuccess(true);
      toast.success("Registration successful! Please check your email to verify your account.");

      // Redirect after a delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Welcome to ExJAM Alumni!</h2>
              <p className="text-gray-600">
                Your account has been created successfully. Please check your email to verify your account.
              </p>
              <div className="pt-4">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                <p className="text-sm text-gray-500 mt-2">Redirecting to dashboard...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 py-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
      </div>

      <div className="relative w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-xl mb-4">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create Your Account</h1>
          <p className="text-gray-600 mt-2">Join the ExJAM Alumni community</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex-1 relative">
                  <div className="flex items-center">
                    <div
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                        ${currentStep >= step.id 
                          ? 'bg-blue-600 text-white shadow-lg' 
                          : 'bg-gray-200 text-gray-500'
                        }
                      `}
                    >
                      {currentStep > step.id ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div className="flex-1 h-1 mx-2">
                        <div className="h-full bg-gray-200 rounded">
                          <div 
                            className={`h-full bg-blue-600 rounded transition-all duration-500`}
                            style={{ width: currentStep > step.id ? '100%' : '0%' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <p className={`
                    text-xs mt-2 font-medium transition-colors
                    ${currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'}
                  `}>
                    {step.title}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur">
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title} Information</CardTitle>
            <CardDescription>Step {currentStep} of {steps.length}</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Step 1: Account */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
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

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                        {...register("password")}
                      />
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  {watchedFields.password && (
                    <PasswordStrength 
                      password={watchedFields.password} 
                      onStrengthChange={setPasswordStrength}
                    />
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter your password"
                        className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                        {...register("confirmPassword")}
                      />
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Personal Information */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        className={errors.firstName ? 'border-red-500' : ''}
                        {...register("firstName")}
                      />
                      {errors.firstName && (
                        <p className="text-sm text-red-600">{errors.firstName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        className={errors.lastName ? 'border-red-500' : ''}
                        {...register("lastName")}
                      />
                      {errors.lastName && (
                        <p className="text-sm text-red-600">{errors.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <div className="relative">
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+234 800 000 0000"
                        className="pl-10"
                        {...register("phone")}
                      />
                      <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Alumni Information */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="graduationYear">Graduation Year (Optional)</Label>
                    <Input
                      id="graduationYear"
                      placeholder="e.g., 1995"
                      {...register("graduationYear")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="squadron">Squadron (Optional)</Label>
                    <Input
                      id="squadron"
                      placeholder="e.g., Green Squadron"
                      {...register("squadron")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chapter">Chapter (Optional)</Label>
                    <Input
                      id="chapter"
                      placeholder="e.g., Lagos Chapter"
                      {...register("chapter")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentLocation">Current Location (Optional)</Label>
                    <div className="relative">
                      <Input
                        id="currentLocation"
                        placeholder="City, Country"
                        className="pl-10"
                        {...register("currentLocation")}
                      />
                      <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Professional Information */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentOccupation">Current Occupation (Optional)</Label>
                    <Input
                      id="currentOccupation"
                      placeholder="e.g., Software Engineer"
                      {...register("currentOccupation")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Company/Organization (Optional)</Label>
                    <div className="relative">
                      <Input
                        id="company"
                        placeholder="e.g., Tech Corp"
                        className="pl-10"
                        {...register("company")}
                      />
                      <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Terms and Conditions */}
                  <div className="space-y-4">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="termsAccepted"
                        checked={termsAccepted}
                        onCheckedChange={(checked) => setValue("termsAccepted", !!checked)}
                      />
                      <label htmlFor="termsAccepted" className="text-sm leading-relaxed cursor-pointer">
                        I accept the{" "}
                        <Link href="/terms" className="text-blue-600 hover:underline">
                          Terms and Conditions
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-blue-600 hover:underline">
                          Privacy Policy
                        </Link>
                      </label>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="marketingConsent"
                        checked={watchedFields.marketingConsent}
                        onCheckedChange={(checked) => setValue("marketingConsent", !!checked)}
                      />
                      <label htmlFor="marketingConsent" className="text-sm leading-relaxed cursor-pointer">
                        I would like to receive updates and newsletters about ExJAM Alumni events and activities
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </CardContent>

          <CardFooter className="flex justify-between">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={isSubmitting}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
            )}
            
            <div className={currentStep === 1 ? 'w-full' : 'ml-auto'}>
              {currentStep < steps.length ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="w-full sm:w-auto"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSubmitting || !termsAccepted || authLoading}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Complete Registration
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-800">
              Sign in
            </Link>
          </p>
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
      `}</style>
    </div>
  );
}