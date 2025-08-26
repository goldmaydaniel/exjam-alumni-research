"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MilitaryServiceForm } from "./military-service-form";
import { ProfileCompletionWorkflow } from "./profile-completion-workflow";
import {
  calculateMilitaryProfileCompleteness,
  type MilitaryServiceData,
} from "@/lib/military-verification";
import { cn } from "@/lib/utils";
import {
  User,
  Shield,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Basic registration schema
const BasicRegistrationSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type BasicRegistrationData = z.infer<typeof BasicRegistrationSchema>;

interface EnhancedRegistrationFlowProps {
  className?: string;
  redirectTo?: string;
}

export const EnhancedRegistrationFlow: React.FC<EnhancedRegistrationFlowProps> = ({
  className,
  redirectTo = "/dashboard",
}) => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationData, setRegistrationData] = useState<{
    basic?: BasicRegistrationData;
    military?: MilitaryServiceData;
  }>({});
  const [registrationId, setRegistrationId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<BasicRegistrationData>({
    resolver: zodResolver(BasicRegistrationSchema),
    mode: "onChange",
  });

  const watchedValues = watch();

  // Calculate overall progress
  const getProgress = () => {
    switch (currentStep) {
      case 1:
        return 25;
      case 2:
        return 60;
      case 3:
        return 100;
      default:
        return 0;
    }
  };

  // Handle basic registration submission
  const handleBasicRegistration = async (data: BasicRegistrationData) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
          phone: data.phone,
          requireMilitaryInfo: true,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setRegistrationData((prev) => ({ ...prev, basic: data }));
        setRegistrationId(result.userId);
        setCurrentStep(2);
      } else {
        const error = await response.json();
        console.error("Registration error:", error);
        // Handle error display
      }
    } catch (error) {
      console.error("Registration submission error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle military service submission
  const handleMilitaryRegistration = async (data: MilitaryServiceData) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/verify-military", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          userId: registrationId,
        }),
      });

      if (response.ok) {
        setRegistrationData((prev) => ({ ...prev, military: data }));
        setCurrentStep(3);
      } else {
        const error = await response.json();
        console.error("Military verification error:", error);
        // Handle error display
      }
    } catch (error) {
      console.error("Military submission error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Complete registration and redirect
  const completeRegistration = () => {
    router.push(redirectTo);
  };

  const steps = [
    { number: 1, title: "Personal Information", icon: User },
    { number: 2, title: "Military Service", icon: Shield },
    { number: 3, title: "Complete", icon: CheckCircle },
  ];

  return (
    <div className={cn("mx-auto max-w-4xl space-y-6", className)}>
      {/* Progress Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Join EXJAM Alumni Association</h1>
              <Badge variant="outline">Step {currentStep} of 3</Badge>
            </div>

            <Progress value={getProgress()} className="h-2" />

            <div className="flex justify-between">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className={cn(
                    "flex items-center gap-2 text-sm",
                    currentStep >= step.number ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border-2",
                      currentStep >= step.number
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground"
                    )}
                  >
                    {currentStep > step.number ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <step.icon className="h-4 w-4" />
                    )}
                  </div>
                  <span className="hidden md:block">{step.title}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <div className="min-h-[600px]">
        {/* Step 1: Basic Registration */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <p className="text-muted-foreground">
                Please provide your basic information to create your account.
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit(handleBasicRegistration)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">
                      First Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      {...register("firstName")}
                      placeholder="Enter your first name"
                    />
                    {errors.firstName && (
                      <p className="text-sm text-destructive">{errors.firstName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">
                      Last Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      {...register("lastName")}
                      placeholder="Enter your last name"
                    />
                    {errors.lastName && (
                      <p className="text-sm text-destructive">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="Enter your email address"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    {...register("phone")}
                    placeholder="Enter your phone number"
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Password <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      {...register("password")}
                      placeholder="Create a strong password"
                    />
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirm Password <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...register("confirmPassword")}
                      placeholder="Confirm your password"
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    After creating your account, you'll need to provide your military service
                    information to complete your EXJAM membership registration.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={!isValid || isLoading}
                    className="flex items-center gap-2"
                  >
                    {isLoading ? "Creating Account..." : "Continue"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Military Service */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> All EXJAM members must provide verified military service
                information. This step is mandatory to complete your registration.
              </AlertDescription>
            </Alert>

            <MilitaryServiceForm
              onSubmit={handleMilitaryRegistration}
              isLoading={isLoading}
              showTitle={true}
              required={true}
              userId={registrationId || undefined}
            />

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Completion */}
        {currentStep === 3 && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-green-600">Registration Complete!</h2>
                  <p className="text-muted-foreground">Welcome to the EXJAM Alumni Association</p>
                </div>

                <div className="space-y-4 rounded-lg bg-muted/50 p-6">
                  <h3 className="font-semibold">What happens next?</h3>
                  <ul className="space-y-2 text-left text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />
                      Your account has been created successfully
                    </li>
                    <li className="flex items-start gap-2">
                      <Clock className="mt-0.5 h-4 w-4 text-yellow-600" />
                      Your military service information is being verified by our administrators
                    </li>
                    <li className="flex items-start gap-2">
                      <Shield className="mt-0.5 h-4 w-4 text-blue-600" />
                      You'll receive an email confirmation once verification is complete
                    </li>
                    <li className="flex items-start gap-2">
                      <User className="mt-0.5 h-4 w-4 text-primary" />
                      You can access most features immediately, with full access after verification
                    </li>
                  </ul>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> Please check your email for a verification link.
                    Some features may be limited until your military service is verified.
                  </AlertDescription>
                </Alert>

                <Button onClick={completeRegistration} size="lg" className="w-full md:w-auto">
                  Continue to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Help Section */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="space-y-2 text-center">
            <h3 className="font-medium">Need Help?</h3>
            <p className="text-sm text-muted-foreground">
              If you have questions about the registration process or need assistance with your
              military service information, please contact our support team.
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <a href="mailto:support@exjam.org" className="text-primary hover:underline">
                Email Support
              </a>
              <span className="text-muted-foreground">•</span>
              <a href="tel:+234-xxx-xxxx-xxx" className="text-primary hover:underline">
                Call Support
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedRegistrationFlow;
