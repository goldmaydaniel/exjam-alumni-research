"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  GraduationCap,
  Shield,
  Camera,
  Calendar,
  Users,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Star,
  Sparkles,
  Building,
  Globe,
  Heart,
  Info,
} from "lucide-react";

// Unified registration schema
const registrationSchema = z.object({
  // Step 1: Basic Information
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  
  // Step 2: Account Security
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
  
  // Step 3: Alumni Details
  serviceNumber: z.string().optional(),
  squadron: z.string().optional(),
  chapter: z.string().optional(),
  graduationYear: z.string().optional(),
  currentLocation: z.string().optional(),
  
  // Step 4: Professional Information
  currentOccupation: z.string().optional(),
  company: z.string().optional(),
  bio: z.string().optional(),
  
  // Step 5: Preferences & Terms
  receiveUpdates: z.boolean().default(true),
  termsAccepted: z.boolean(),
  marketingConsent: z.boolean().default(false),
  
  // Registration Type
  registrationType: z.enum(["alumni", "guest", "member"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

const steps = [
  { id: 1, title: "Basic Info", icon: User, description: "Your personal information" },
  { id: 2, title: "Account Security", icon: Lock, description: "Create your password" },
  { id: 3, title: "Alumni Details", icon: GraduationCap, description: "Your EXJAM background" },
  { id: 4, title: "Professional Info", icon: Building, description: "Work and experience" },
  { id: 5, title: "Preferences", icon: Heart, description: "Settings and terms" },
];

const squadrons = [
  { value: "GREEN", label: "Green Squadron", color: "bg-green-100 text-green-800" },
  { value: "RED", label: "Red Squadron", color: "bg-red-100 text-red-800" },
  { value: "PURPLE", label: "Purple Squadron", color: "bg-purple-100 text-purple-800" },
  { value: "YELLOW", label: "Yellow Squadron", color: "bg-yellow-100 text-yellow-800" },
  { value: "DORNIER", label: "Dornier Squadron", color: "bg-blue-100 text-blue-800" },
  { value: "PUMA", label: "Puma Squadron", color: "bg-orange-100 text-orange-800" },
];

const chapters = [
  "ABUJA", "LAGOS", "PORT HARCOURT", "KANO", "KADUNA", "ENUGU", "CALABAR", "MAIDUGURI", "INTERNATIONAL"
];

export default function UnifiedRegistrationPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

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
      receiveUpdates: true,
      termsAccepted: false,
      marketingConsent: false,
      registrationType: "alumni",
    },
    mode: "onChange",
  });

  const watchedFields = watch();
  const termsAccepted = watch("termsAccepted");
  const registrationType = watch("registrationType");

  // Auto-focus first field of current step
  useEffect(() => {
    const focusField = {
      1: "firstName",
      2: "password",
      3: "serviceNumber",
      4: "currentOccupation",
      5: "termsAccepted",
    }[currentStep];
    
    if (focusField) {
      setTimeout(() => setFocus(focusField as any), 100);
    }
  }, [currentStep, setFocus]);

  // Calculate password strength
  useEffect(() => {
    const password = watchedFields.password || "";
    let strength = 0;
    
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    
    setPasswordStrength(strength);
  }, [watchedFields.password]);

  const validateStep = async (step: number) => {
    const stepFields = {
      1: ["firstName", "lastName", "email", "phone"],
      2: ["password", "confirmPassword"],
      3: [], // All optional
      4: [], // All optional
      5: ["termsAccepted"],
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

    if (passwordStrength < 75) {
      toast.error("Please choose a stronger password");
      return;
    }

    setIsSubmitting(true);

    try {
      // Determine registration endpoint based on type
      const endpoint = data.registrationType === "alumni" 
        ? "/api/auth/register/afms" 
        : "/api/auth/register/enhanced";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          fullName: `${data.firstName} ${data.lastName}`,
          profilePhoto: profilePhotoUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Registration failed");
      }

      setRegistrationSuccess(true);
      toast.success("Registration successful! Welcome to EXJAM Alumni Association.");

      // Redirect to events page after successful registration
      setTimeout(() => {
        router.push("/events?registered=true");
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <Card className="w-full max-w-md text-center p-8">
          <div className="mx-auto mb-6 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-800 mb-4">
            Welcome to EXJAM!
          </CardTitle>
          <p className="text-green-700 mb-6">
            Your account has been created successfully. You're now ready to explore events and connect with fellow alumni.
          </p>
          <Button 
            onClick={() => router.push("/events")}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Explore Events
          </Button>
        </Card>
      </div>
    );
  }

  const progress = (currentStep / steps.length) * 100;
  const currentStepData = steps[currentStep - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-900">Join EXJAM Alumni</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect with fellow Ex-Junior Airmen, attend events, and build lasting relationships
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {steps.length}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                index + 1 <= currentStep
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "bg-white border-gray-300 text-gray-500"
              }`}>
                {index + 1 < currentStep ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 ${
                  index + 1 < currentStep ? "bg-indigo-600" : "bg-gray-300"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Main Form */}
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              {currentStepData.title}
            </CardTitle>
            <p className="text-gray-600">{currentStepData.description}</p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        {...register("firstName")}
                        placeholder="John"
                        className="mt-1"
                      />
                      {errors.firstName && (
                        <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        {...register("lastName")}
                        placeholder="Doe"
                        className="mt-1"
                      />
                      {errors.lastName && (
                        <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="john@example.com"
                      className="mt-1"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...register("phone")}
                      placeholder="+234 801 234 5678"
                      className="mt-1"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Account Security */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative mt-1">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        {...register("password")}
                        placeholder="Create a strong password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                    )}
                    
                    {/* Password Strength Indicator */}
                    <div className="mt-2">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Password Strength</span>
                        <span>{passwordStrength}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            passwordStrength < 25 ? "bg-red-500" :
                            passwordStrength < 50 ? "bg-orange-500" :
                            passwordStrength < 75 ? "bg-yellow-500" : "bg-green-500"
                          }`}
                          style={{ width: `${passwordStrength}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative mt-1">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        {...register("confirmPassword")}
                        placeholder="Confirm your password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Alumni Details */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="serviceNumber">Service Number (Optional)</Label>
                    <Input
                      id="serviceNumber"
                      {...register("serviceNumber")}
                      placeholder="NAF/123456"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="squadron">Squadron (Optional)</Label>
                    <Select onValueChange={(value) => setValue("squadron", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select your squadron" />
                      </SelectTrigger>
                      <SelectContent>
                        {squadrons.map((squadron) => (
                          <SelectItem key={squadron.value} value={squadron.value}>
                            <Badge className={squadron.color}>{squadron.label}</Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="chapter">Chapter (Optional)</Label>
                    <Select onValueChange={(value) => setValue("chapter", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select your chapter" />
                      </SelectTrigger>
                      <SelectContent>
                        {chapters.map((chapter) => (
                          <SelectItem key={chapter} value={chapter}>
                            {chapter}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="graduationYear">Graduation Year (Optional)</Label>
                      <Input
                        id="graduationYear"
                        {...register("graduationYear")}
                        placeholder="2020"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="currentLocation">Current Location (Optional)</Label>
                      <Input
                        id="currentLocation"
                        {...register("currentLocation")}
                        placeholder="Lagos, Nigeria"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Professional Information */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="currentOccupation">Current Occupation (Optional)</Label>
                      <Input
                        id="currentOccupation"
                        {...register("currentOccupation")}
                        placeholder="Software Engineer"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company">Company (Optional)</Label>
                      <Input
                        id="company"
                        {...register("company")}
                        placeholder="Tech Company Ltd"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="bio">Bio (Optional)</Label>
                    <Textarea
                      id="bio"
                      {...register("bio")}
                      placeholder="Tell us about yourself..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              {/* Step 5: Preferences & Terms */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="receiveUpdates"
                        checked={watchedFields.receiveUpdates}
                        onCheckedChange={(checked) => setValue("receiveUpdates", checked as boolean)}
                      />
                      <Label htmlFor="receiveUpdates">
                        Receive updates about events and alumni activities
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="marketingConsent"
                        checked={watchedFields.marketingConsent}
                        onCheckedChange={(checked) => setValue("marketingConsent", checked as boolean)}
                      />
                      <Label htmlFor="marketingConsent">
                        I agree to receive marketing communications
                      </Label>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="termsAccepted"
                        checked={termsAccepted}
                        onCheckedChange={(checked) => setValue("termsAccepted", checked as boolean)}
                        className="mt-1"
                      />
                      <Label htmlFor="termsAccepted" className="text-sm">
                        I accept the{" "}
                        <a href="/terms" className="text-indigo-600 hover:underline">
                          Terms and Conditions
                        </a>{" "}
                        and{" "}
                        <a href="/privacy" className="text-indigo-600 hover:underline">
                          Privacy Policy
                        </a>
                        *
                      </Label>
                    </div>
                    {errors.termsAccepted && (
                      <p className="text-red-500 text-sm mt-1">{errors.termsAccepted.message}</p>
                    )}
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">What happens next?</p>
                        <p className="mt-1">
                          After registration, you'll be redirected to explore upcoming events and start connecting with fellow alumni.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="flex items-center"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                
                {currentStep < steps.length ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Complete Registration
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Registration Type Info */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Already have an account?{" "}
            <a href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
