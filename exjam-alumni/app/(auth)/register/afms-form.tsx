"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, User, Phone, Calendar, Target } from "lucide-react";
import { useAuthStore } from "@/lib/store/consolidated-auth";
import toast from "react-hot-toast";

// Nigerian states for chapter selection
const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT-Abuja",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
  "International",
];

const registrationSchema = z
  .object({
    // Personal Information
    fullName: z.string().min(3, "Full name must be at least 3 characters"),
    serviceNumber: z
      .string()
      .regex(/^AFMS\s\d{2}\/\d{4}$/, "Format: AFMS 00/0000 (e.g., AFMS 95/1234)"),
    squadron: z.enum(["ALPHA", "JAGUAR", "MIG", "HERCULES", "DONIER"] as const),

    // Contact Information
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    chapter: z.string().min(1, "Please select your chapter"),
    currentLocation: z.string().min(3, "Please enter your current location"),
    emergencyContact: z.string().min(10, "Emergency contact is required"),

    // Event Information
    arrivalDate: z.string().min(1, "Please select your arrival date"),
    departureDate: z.string().min(1, "Please select your departure date"),
    expectations: z.string().min(20, "Please share what you hope to gain (minimum 20 characters)"),
    specialRequests: z.string().optional(),

    // Account Information
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegistrationFormData = z.infer<typeof registrationSchema>;

const squadronColors = {
  ALPHA: { bg: "bg-yellow-50", border: "border-yellow-500", text: "text-yellow-700" },
  JAGUAR: { bg: "bg-blue-50", border: "border-blue-500", text: "text-blue-700" },
  MIG: { bg: "bg-green-50", border: "border-green-500", text: "text-green-700" },
  HERCULES: { bg: "bg-red-50", border: "border-red-500", text: "text-red-700" },
  DONIER: { bg: "bg-purple-50", border: "border-purple-500", text: "text-purple-700" },
};

export default function AFMSRegistrationForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
  });

  const selectedSquadron = watch("squadron");

  const onSubmit = async (data: RegistrationFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register/afms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Registration failed");
      }

      // Store user and token
      login(result.user, result.token);

      setIsSuccess(true);
      toast.success("Registration successful!");

      // Redirect to event registration
      setTimeout(() => {
        router.push("/events");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    // Validate current step before moving forward
    const fieldsToValidate = {
      1: ["fullName", "serviceNumber", "set", "squadron"],
      2: ["email", "phone", "chapter", "currentLocation", "emergencyContact"],
      3: ["arrivalDate", "departureDate"],
    };

    const currentFields = fieldsToValidate[currentStep as keyof typeof fieldsToValidate];
    if (currentFields) {
      let hasErrors = false;
      currentFields.forEach((field) => {
        const value = watch(field as keyof RegistrationFormData);
        if (!value || value === "") {
          hasErrors = true;
        }
      });

      if (hasErrors) {
        toast.error("Please fill in all required fields");
        return;
      }
    }

    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  if (isSuccess) {
    return (
      <div className="container flex min-h-[80vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
            <CardTitle>Registration Successful!</CardTitle>
            <CardDescription>Welcome to the AFMS Alumni PG Conference 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm text-muted-foreground">
              We&apos;ve sent a confirmation email to your registered email address. You&apos;ll be
              redirected to complete your event registration shortly.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">AFMS Alumni PG Conference 2025</CardTitle>
            <CardDescription>November 28-30, 2025 | Registration Form</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Progress Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className={`flex items-center ${step < 4 ? "flex-1" : ""}`}>
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${
                        step <= currentStep
                          ? "bg-primary text-primary-foreground"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {step}
                    </div>
                    {step < 4 && (
                      <div
                        className={`mx-2 h-1 flex-1 ${
                          step < currentStep ? "bg-primary" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-xs">Personal</span>
                <span className="text-xs">Contact</span>
                <span className="text-xs">Event</span>
                <span className="text-xs">Account</span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Personal Information</h3>
                  </div>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Please provide your basic personal information
                  </p>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fullName">
                        Full Name (as it appears on official documents) *
                      </Label>
                      <Input
                        id="fullName"
                        {...register("fullName")}
                        placeholder="Enter your full legal name"
                      />
                      {errors.fullName && (
                        <p className="mt-1 text-sm text-destructive">{errors.fullName.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="serviceNumber">Service Number *</Label>
                      <div className="relative">
                        <Input
                          id="serviceNumber"
                          {...register("serviceNumber")}
                          placeholder="AFMS 00/0000"
                          defaultValue="AFMS "
                          pattern="^AFMS\s\d{2}/\d{4}$"
                          maxLength={12}
                          onChange={(e) => {
                            let value = e.target.value;
                            // Ensure AFMS prefix with space
                            if (!value.startsWith("AFMS ")) {
                              value = "AFMS " + value.replace(/^AFMS\s?/, "");
                            }
                            // Auto-format with slash
                            let cleaned = value.replace(/^AFMS\s?/, "").replace(/[^\d]/g, "");
                            if (cleaned.length > 2) {
                              cleaned = cleaned.slice(0, 2) + "/" + cleaned.slice(2, 6);
                            }
                            e.target.value = "AFMS " + cleaned;
                          }}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          Format: AFMS 00/0000
                        </span>
                      </div>
                      {errors.serviceNumber && (
                        <p className="mt-1 text-sm text-destructive">
                          {errors.serviceNumber.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="squadron">Squadron *</Label>
                      <Select
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        onValueChange={(value) => setValue("squadron", value as any)}
                      >
                        <SelectTrigger
                          className={
                            selectedSquadron ? squadronColors[selectedSquadron].border : ""
                          }
                        >
                          <SelectValue placeholder="Select your squadron" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALPHA">
                            <span className="flex items-center gap-2">
                              <span className="h-3 w-3 rounded-full bg-yellow-500" />
                              Alpha (Yellow)
                            </span>
                          </SelectItem>
                          <SelectItem value="JAGUAR">
                            <span className="flex items-center gap-2">
                              <span className="h-3 w-3 rounded-full bg-blue-500" />
                              Jaguar (Blue)
                            </span>
                          </SelectItem>
                          <SelectItem value="MIG">
                            <span className="flex items-center gap-2">
                              <span className="h-3 w-3 rounded-full bg-green-500" />
                              Mig (Green)
                            </span>
                          </SelectItem>
                          <SelectItem value="HERCULES">
                            <span className="flex items-center gap-2">
                              <span className="h-3 w-3 rounded-full bg-red-500" />
                              Hercules (Red)
                            </span>
                          </SelectItem>
                          <SelectItem value="DONIER">
                            <span className="flex items-center gap-2">
                              <span className="h-3 w-3 rounded-full bg-purple-500" />
                              Donier (Purple)
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.squadron && (
                        <p className="mt-1 text-sm text-destructive">{errors.squadron.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="button" onClick={nextStep}>
                      Next Step →
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Contact Information */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Contact Information</h3>
                  </div>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Your contact details for event communication
                  </p>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email Address (for confirmation and updates) *</Label>
                      <Input
                        id="email"
                        type="email"
                        {...register("email")}
                        placeholder="We'll use this to send you event updates"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        {...register("phone")}
                        placeholder="Include country code (e.g., +234 for Nigeria)"
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-destructive">{errors.phone.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="chapter">Chapter (Select your chapter location) *</Label>
                      <Select onValueChange={(value) => setValue("chapter", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select the chapter/state where you are based" />
                        </SelectTrigger>
                        <SelectContent>
                          {NIGERIAN_STATES.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.chapter && (
                        <p className="mt-1 text-sm text-destructive">{errors.chapter.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="currentLocation">
                        Current Location (City, State/Province, Country) *
                      </Label>
                      <Input
                        id="currentLocation"
                        {...register("currentLocation")}
                        placeholder="Your current residence for planning"
                      />
                      {errors.currentLocation && (
                        <p className="mt-1 text-sm text-destructive">
                          {errors.currentLocation.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="emergencyContact">
                        Emergency Contact (Name and Phone Number) *
                      </Label>
                      <Input
                        id="emergencyContact"
                        {...register("emergencyContact")}
                        placeholder="Contact person in case of emergency during the event"
                      />
                      {errors.emergencyContact && (
                        <p className="mt-1 text-sm text-destructive">
                          {errors.emergencyContact.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      ← Previous
                    </Button>
                    <Button type="button" onClick={nextStep}>
                      Next Step →
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Event Information */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Event Information</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="arrivalDate">Expected Arrival Date *</Label>
                      <Select onValueChange={(value) => setValue("arrivalDate", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your arrival date" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2025-11-27">
                            November 27th, 2025 (Day before conference)
                          </SelectItem>
                          <SelectItem value="2025-11-28">
                            November 28th, 2025 (Conference start day)
                          </SelectItem>
                          <SelectItem value="other">Other date</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.arrivalDate && (
                        <p className="mt-1 text-sm text-destructive">
                          {errors.arrivalDate.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="departureDate">Expected Departure Date *</Label>
                      <Select onValueChange={(value) => setValue("departureDate", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your departure date" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2025-11-30">
                            November 30th, 2025 (Conference end day)
                          </SelectItem>
                          <SelectItem value="2025-12-01">
                            December 1st, 2025 (Day after conference)
                          </SelectItem>
                          <SelectItem value="other">Other date</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.departureDate && (
                        <p className="mt-1 text-sm text-destructive">
                          {errors.departureDate.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="expectations">
                        What do you hope to gain from attending the PG Conference? *
                      </Label>
                      <Textarea
                        id="expectations"
                        {...register("expectations")}
                        placeholder="Your goals and expectations for the event"
                        className="min-h-[100px]"
                      />
                      {errors.expectations && (
                        <p className="mt-1 text-sm text-destructive">
                          {errors.expectations.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="specialRequests">
                        Additional Comments or Special Requests
                      </Label>
                      <Textarea
                        id="specialRequests"
                        {...register("specialRequests")}
                        placeholder="Any other information or special requests"
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      ← Previous
                    </Button>
                    <Button type="button" onClick={nextStep}>
                      Next Step →
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Account Setup */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Create Your Account</h3>
                  </div>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Set up your password to secure your account
                  </p>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        {...register("password")}
                        placeholder="Create a strong password (min 8 characters)"
                      />
                      {errors.password && (
                        <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        {...register("confirmPassword")}
                        placeholder="Re-enter your password"
                      />
                      {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-destructive">
                          {errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      ← Previous
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      onClick={(e) => {
                        const password = watch("password");
                        const confirmPassword = watch("confirmPassword");
                        if (!password || !confirmPassword) {
                          e.preventDefault();
                          toast.error("Please enter both password fields");
                          return;
                        }
                        if (password !== confirmPassword) {
                          e.preventDefault();
                          toast.error("Passwords do not match");
                          return;
                        }
                      }}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        "Complete Registration"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
