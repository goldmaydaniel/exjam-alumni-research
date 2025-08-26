"use client";

import { useState, useRef, useEffect } from "react";
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
import {
  Loader2,
  CheckCircle,
  User,
  Phone,
  Calendar,
  Camera,
  Upload,
  Package,
  CreditCard,
  Image as ImageIcon,
  Info,
} from "lucide-react";
import { useAuth } from "@/lib/store/consolidated-auth";
import { GuestOnlyRoute } from "@/components/auth/guest-only-route";
import toast from "react-hot-toast";
import { SmartPhotoCapture } from "@/components/smart-photo-capture";

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
    squadron: z.enum(["GREEN", "RED", "PURPLE", "YELLOW", "DORNIER", "PUMA"] as const),
    profilePhoto: z.string().optional(),

    // Contact Information
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    chapter: z.string().min(1, "Chapter is required"),
    currentLocation: z.string().min(2, "Current location is required"),
    emergencyContact: z.string().min(10, "Emergency contact is required"),

    // Event Details
    arrivalDate: z.string().min(1, "Arrival date is required"),
    departureDate: z.string().min(1, "Departure date is required"),
    expectations: z.string().optional(),
    specialRequests: z.string().optional(),

    // Event Package (fixed at STANDARD)
    eventPackage: z.literal("STANDARD"),
    badgeType: z.literal("STANDARD"),

    // Account Details (optional for guest registration)
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .optional()
      .or(z.literal("")),
    confirmPassword: z.string().optional().or(z.literal("")),
    skipAccount: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // Only validate password match if both are provided
      if (data.password && data.password !== "" && !data.skipAccount) {
        return data.password === data.confirmPassword;
      }
      return true;
    },
    {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    }
  );

type RegistrationFormData = z.infer<typeof registrationSchema>;

const squadronColors = {
  GREEN: { bg: "bg-green-50", border: "border-green-500", text: "text-green-700" },
  RED: { bg: "bg-red-50", border: "border-red-500", text: "text-red-700" },
  PURPLE: { bg: "bg-purple-50", border: "border-purple-500", text: "text-purple-700" },
  YELLOW: { bg: "bg-yellow-50", border: "border-yellow-500", text: "text-yellow-700" },
  DORNIER: { bg: "bg-blue-50", border: "border-blue-500", text: "text-blue-700" },
  PUMA: { bg: "bg-gray-50", border: "border-gray-500", text: "text-gray-700" },
};

const eventPackages = {
  STANDARD: {
    name: "Conference Registration",
    price: 20000,
    features: [
      "Full Conference Access",
      "Welcome Reception",
      "All Plenary Sessions",
      "Breakout Sessions",
      "Networking Opportunities",
      "Lunch & Refreshments",
      "Conference Materials",
      "Certificate of Attendance",
      "Alumni Reunion Activities",
    ],
  },
};

// Single badge type included in registration
// const badgeTypes = {
//   STANDARD: { name: "Conference Badge", price: 0 },
// };

export default function EnhancedAFMSRegistrationForm() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error on component mount
  useEffect(() => {
    setError(null);
    // Also clear any form errors
    clearErrors();
    // Reset form to clean state
    if (errors) {
      clearErrors();
    }
  }, []);

  // Clear error when changing steps
  useEffect(() => {
    setError(null);
    // Clear form validation errors when changing steps
    clearErrors();
  }, [currentStep]);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [skipAccount, setSkipAccount] = useState(false);

  // Test data autofill function
  const autofillTestData = () => {
    // Personal Information
    setValue("fullName", "John Doe");
    setValue("serviceNumber", "AFMS 95/1234");
    setValue("squadron", "GREEN");

    // Contact Information
    setValue("email", `test${Date.now()}@example.com`); // Unique email
    setValue("phone", "+2348012345678");
    setValue("chapter", "Lagos");
    setValue("currentLocation", "Lagos, Nigeria");
    setValue("emergencyContact", "Jane Doe - +2348087654321");

    // Event Details
    setValue("arrivalDate", "2025-03-28");
    setValue("departureDate", "2025-03-30");
    setValue("expectations", "Looking forward to reconnecting with fellow alumni");
    setValue("specialRequests", "None");

    // Account Details
    setValue("password", "Password123!");
    setValue("confirmPassword", "Password123!");

    // Package
    setValue("eventPackage", "STANDARD");
    setValue("badgeType", "STANDARD");

    toast.success("Test data filled! Review and click through steps.");
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
    clearErrors,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      eventPackage: "STANDARD",
      badgeType: "STANDARD",
    },
  });

  const selectedSquadron = watch("squadron");

  // Ensure eventPackage and badgeType are always set
  useEffect(() => {
    setValue("eventPackage", "STANDARD");
    setValue("badgeType", "STANDARD");
  }, [setValue]);

  const calculateTotal = () => {
    // Fixed price of 20,000 Naira
    return 20000;
  };

  const handlePhotoCapture = (imageData: string) => {
    setProfileImage(imageData);
    setValue("profilePhoto", imageData);
    setIsCameraActive(false);
  };

  const handlePhotoCancel = () => {
    setIsCameraActive(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setProfileImage(result);
        setValue("profilePhoto", result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: RegistrationFormData) => {
    console.log("Form submission data:", data);

    // Check if passwords match before submission (only if not skipping account)
    if (
      !skipAccount &&
      data.password &&
      data.password !== "" &&
      data.password !== data.confirmPassword
    ) {
      toast.error("Passwords don't match. Please check and try again.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    clearErrors();

    try {
      // Remove confirmPassword before sending to API
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, ...dataWithoutConfirm } = data;

      // If guest registration, remove password or set to empty
      if (skipAccount) {
        delete dataWithoutConfirm.password;
      }

      const submissionData = {
        ...dataWithoutConfirm,
        eventPackage: "STANDARD",
        badgeType: "STANDARD",
        totalAmount: calculateTotal(),
        isGuest: skipAccount,
      };
      console.log("Sending to API:", submissionData);

      const response = await fetch("/api/auth/register/afms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();
      console.log("API Response:", result);

      if (!response.ok) {
        // Log validation details if available
        if (result.details) {
          console.error("Validation details:", result.details);
        }
        throw new Error(result.error || "Registration failed");
      }

      // Sign up user with Supabase if account was created
      if (!skipAccount && result.user) {
        try {
          await signUp(result.user.email, result.tempPassword || "temp-password-change-me", {
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            fullName: result.user.fullName,
            serviceNumber: result.user.serviceNumber,
            squadron: result.user.squadron,
            phone: result.user.phone,
            chapter: result.user.chapter,
            currentLocation: result.user.currentLocation,
          });
        } catch (authError) {
          console.warn("Supabase signup failed, but registration succeeded:", authError);
          // Continue with the flow even if Supabase signup fails
        }
      }

      setIsSuccess(true);
      toast.success("Registration successful!");

      // Redirect to payment page with registration ID
      setTimeout(() => {
        const params = new URLSearchParams({
          amount: calculateTotal().toString(),
          package: "STANDARD",
          registrationId: result.registrationId || "",
        });
        router.push(`/payment?${params.toString()}`);
      }, 2000);
    } catch (err) {
      console.error("Registration error:", err);
      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = async () => {
    // Clear any previous errors
    setError(null);
    clearErrors();

    // Validate current step before moving forward
    const fieldsToValidate = {
      1: ["fullName", "serviceNumber", "squadron"] as const,
      2: [] as const, // Profile photo is optional
      3: ["email", "phone", "chapter", "currentLocation", "emergencyContact"] as const,
      4: ["arrivalDate", "departureDate"] as const,
      5: [] as const, // Package is fixed at STANDARD, no validation needed
    };

    const currentFields = fieldsToValidate[currentStep as keyof typeof fieldsToValidate];
    if (currentFields && currentFields.length > 0) {
      // Use react-hook-form's trigger for validation
      const isValid = await trigger(currentFields as any);

      if (!isValid) {
        // Get the specific errors for these fields
        const fieldErrors = currentFields
          .filter((field) => errors[field as keyof typeof errors])
          .map((field) => field);

        if (fieldErrors.length > 0) {
          toast.error(`Please check: ${fieldErrors.join(", ")}`);
        } else {
          toast.error("Please fill in all required fields");
        }
        return;
      }
    }

    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setError(null); // Clear any errors when going back
    clearErrors();
    setCurrentStep(currentStep - 1);
  };

  // Clear errors when user starts typing or clicking
  const handleFieldInteraction = () => {
    if (error) {
      setError(null);
    }
  };

  if (isSuccess) {
    return (
      <div className="container flex min-h-[80vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
            <CardTitle>Registration Successful!</CardTitle>
            <CardDescription>Redirecting to payment page...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <p className="font-semibold">Total Amount:</p>
                <p className="text-2xl font-bold">₦{calculateTotal().toLocaleString()}</p>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                You will be redirected to complete your payment shortly.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <GuestOnlyRoute>
      <div className="container py-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Create Profile</CardTitle>
                  <CardDescription>
                    Sign up to join The ExJAM Association network and register for events
                  </CardDescription>
                </div>
                {/* Test Autofill Button */}
                {process.env.NODE_ENV === "development" ||
                  (true && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={autofillTestData}
                      className="border-yellow-300 bg-yellow-100 hover:bg-yellow-200"
                    >
                      🧪 Autofill Test Data
                    </Button>
                  ))}
              </div>

              {/* Progress Indicator */}
              <div className="mt-6 flex items-center justify-between">
                {[1, 2, 3, 4, 5, 6].map((step) => (
                  <div key={step} className={`flex items-center ${step < 6 ? "flex-1" : ""}`}>
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        currentStep >= step
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {step}
                    </div>
                    {step < 6 && (
                      <div
                        className={`mx-2 h-1 flex-1 ${
                          currentStep > step ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-2 flex justify-between text-xs">
                <span>Identity</span>
                <span>Photo</span>
                <span>Contact</span>
                <span>Location</span>
                <span>Service</span>
                <span>Account</span>
              </div>
            </CardHeader>

            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>
                    {error}
                    {Object.keys(errors).length > 0 && (
                      <div className="mt-2 text-sm">
                        Please check the following fields:
                        <ul className="mt-1 list-inside list-disc">
                          {Object.entries(errors).map(([field, err]) => (
                            <li key={field}>
                              {field}: {err?.message}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6"
                onClick={handleFieldInteraction}
              >
                {/* Step 1: Personal Information */}
                {currentStep === 1 && (
                  <div className="space-y-6">
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
                            placeholder="e.g., AFMS 95/1234"
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
                            Format: AFMS ##/####
                          </span>
                        </div>
                        {errors.serviceNumber && (
                          <p className="mt-1 text-sm text-destructive">
                            {errors.serviceNumber.message}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          Enter your service number as AFMS followed by your set number (2 digits)
                          and personal number (4 digits).
                          <br />
                          Example: <span className="font-semibold">AFMS 95/1234</span> where 95 is
                          your set and 1234 is your unique number.
                        </p>
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
                            <SelectItem value="GREEN">
                              <span className="flex items-center gap-2">
                                <span className="h-3 w-3 rounded-full bg-green-500" />
                                Green Squadron
                              </span>
                            </SelectItem>
                            <SelectItem value="RED">
                              <span className="flex items-center gap-2">
                                <span className="h-3 w-3 rounded-full bg-red-500" />
                                Red Squadron
                              </span>
                            </SelectItem>
                            <SelectItem value="PURPLE">
                              <span className="flex items-center gap-2">
                                <span className="h-3 w-3 rounded-full bg-purple-500" />
                                Purple Squadron
                              </span>
                            </SelectItem>
                            <SelectItem value="YELLOW">
                              <span className="flex items-center gap-2">
                                <span className="h-3 w-3 rounded-full bg-yellow-500" />
                                Yellow Squadron
                              </span>
                            </SelectItem>
                            <SelectItem value="DORNIER">
                              <span className="flex items-center gap-2">
                                <span className="h-3 w-3 rounded-full bg-blue-500" />
                                Dornier Squadron
                              </span>
                            </SelectItem>
                            <SelectItem value="PUMA">
                              <span className="flex items-center gap-2">
                                <span className="h-3 w-3 rounded-full bg-gray-600" />
                                Puma Squadron
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Select the squadron you belonged to during your time at AFMS Jos. Each
                          squadron has its unique identity and traditions.
                        </p>
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

                {/* Step 2: Profile Photo */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                      <ImageIcon className="h-5 w-5" />
                      Profile Photo
                    </h3>

                    {!profileImage && !isCameraActive && (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Choose how you want to add your profile photo
                        </p>
                        <div className="grid gap-4 md:grid-cols-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="flex h-32 flex-col gap-2"
                            onClick={() => setIsCameraActive(true)}
                          >
                            <Camera className="h-8 w-8" />
                            <span>Take Photo</span>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="flex h-32 flex-col gap-2"
                            onClick={() => {
                              fileInputRef.current?.click();
                            }}
                          >
                            <Upload className="h-8 w-8" />
                            <span>Upload Photo</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {isCameraActive && (
                      <SmartPhotoCapture
                        onCapture={handlePhotoCapture}
                        onCancel={handlePhotoCancel}
                      />
                    )}

                    {profileImage && (
                      <div className="space-y-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={profileImage}
                          alt="Profile"
                          className="mx-auto h-48 w-48 rounded-lg object-cover"
                        />
                        <div className="flex justify-center gap-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setProfileImage(null);
                              setValue("profilePhoto", "");
                            }}
                          >
                            Retake Photo
                          </Button>
                        </div>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />

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

                {/* Step 3: Contact Information */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                      <Phone className="h-5 w-5" />
                      Contact Information
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          {...register("email")}
                          placeholder="your.email@example.com"
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
                          placeholder="+234 800 000 0000"
                        />
                        {errors.phone && (
                          <p className="mt-1 text-sm text-destructive">{errors.phone.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="chapter">Chapter (State) *</Label>
                        <Select onValueChange={(value) => setValue("chapter", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your chapter/state" />
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
                          placeholder="Your current residence"
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
                          placeholder="Contact person in case of emergency"
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

                {/* Step 4: Event Details */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                      <Calendar className="h-5 w-5" />
                      Event Details
                    </h3>

                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor="arrivalDate">Expected Arrival Date *</Label>
                          <Select onValueChange={(value) => setValue("arrivalDate", value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select arrival date" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="2025-11-27">
                                November 27th, 2025 (Day before)
                              </SelectItem>
                              <SelectItem value="2025-11-28">
                                November 28th, 2025 (Conference start)
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
                              <SelectValue placeholder="Select departure date" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="2025-11-30">
                                November 30th, 2025 (Conference end)
                              </SelectItem>
                              <SelectItem value="2025-12-01">
                                December 1st, 2025 (Day after)
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
                      </div>

                      <div>
                        <Label htmlFor="expectations">
                          What do you hope to gain from attending the Conference?
                        </Label>
                        <Textarea
                          id="expectations"
                          {...register("expectations")}
                          placeholder="Your goals and expectations for the event"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="specialRequests">
                          Additional Comments or Special Requests
                        </Label>
                        <Textarea
                          id="specialRequests"
                          {...register("specialRequests")}
                          placeholder="Any other information or special requests"
                          rows={3}
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

                {/* Step 5: Event Package & Badge Selection */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                      <Package className="h-5 w-5" />
                      Select Your Package
                    </h3>

                    <div className="space-y-6">
                      <div>
                        <Label className="mb-4 block text-base font-semibold">
                          Conference Registration
                        </Label>
                        <div className="rounded-lg border-2 border-primary bg-primary/5 p-4">
                          <div className="flex items-start space-x-3">
                            <CheckCircle className="mt-1 h-5 w-5 text-green-500" />
                            <div className="flex-1">
                              <div className="text-lg font-semibold">
                                The ExJAM Association Conference 2025
                              </div>
                              <div className="mt-2 text-3xl font-bold text-primary">₦20,000</div>
                              <div className="mt-1 text-sm text-muted-foreground">
                                Registration Fee
                              </div>
                              <ul className="mt-4 space-y-2">
                                {eventPackages.STANDARD.features.map((feature, idx) => (
                                  <li key={idx} className="flex items-center gap-2 text-sm">
                                    <CheckCircle className="h-3 w-3 flex-shrink-0 text-green-500" />
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                        {/* Set values programmatically */}
                      </div>

                      <div className="rounded-lg border bg-muted/30 p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-semibold">Total Registration Fee:</span>
                          <span className="text-3xl font-bold text-primary">₦20,000</span>
                        </div>
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

                {/* Step 6: Account Setup */}
                {currentStep === 6 && (
                  <div className="space-y-6">
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                      <User className="h-5 w-5" />
                      Account Setup (Optional)
                    </h3>

                    {/* Account Benefits Info */}
                    <Alert className="border-blue-200 bg-blue-50">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-900">
                        <strong>Benefits of creating an account:</strong>
                        <ul className="mt-2 space-y-1 text-sm">
                          <li>• Access your event badge anytime</li>
                          <li>• View and manage your registrations</li>
                          <li>• Receive event updates and reminders</li>
                          <li>• Connect with other alumni</li>
                          <li>• Quick check-in at the event</li>
                        </ul>
                      </AlertDescription>
                    </Alert>

                    {/* Skip Account Option */}
                    <div className="rounded-lg border-2 p-4">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id="skipAccount"
                          checked={skipAccount}
                          onChange={(e) => {
                            setSkipAccount(e.target.checked);
                            if (e.target.checked) {
                              setValue("password", "");
                              setValue("confirmPassword", "");
                            }
                          }}
                          className="mt-1 rounded"
                        />
                        <label htmlFor="skipAccount" className="flex-1">
                          <div className="font-medium">Continue as Guest</div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            Skip account creation and proceed directly to payment. You'll receive
                            your registration confirmation via email.
                          </div>
                        </label>
                      </div>
                    </div>

                    {!skipAccount && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="password">Password *</Label>
                          <Input
                            id="password"
                            type="password"
                            {...register("password")}
                            placeholder="Create a strong password"
                            disabled={skipAccount}
                          />
                          {errors.password && !skipAccount && (
                            <p className="mt-1 text-sm text-destructive">
                              {errors.password.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="confirmPassword">Confirm Password *</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            {...register("confirmPassword")}
                            placeholder="Re-enter your password"
                            disabled={skipAccount}
                          />
                          {errors.confirmPassword && !skipAccount && (
                            <p className="mt-1 text-sm text-destructive">
                              {errors.confirmPassword.message}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <Alert>
                      <CreditCard className="h-4 w-4" />
                      <AlertDescription>
                        After registration, you&apos;ll be redirected to complete your payment of{" "}
                        <span className="font-bold">₦{calculateTotal().toLocaleString()}</span>
                      </AlertDescription>
                    </Alert>

                    <div className="flex items-center justify-between">
                      <Button type="button" variant="outline" onClick={prevStep}>
                        ← Previous
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        onClick={() => {
                          // Log any validation errors on button click
                          const formErrors = errors;
                          if (Object.keys(formErrors).length > 0) {
                            console.log("Form validation errors:", formErrors);
                            const firstError = Object.values(formErrors)[0]?.message;
                            if (firstError) {
                              toast.error(`Please fix: ${firstError}`);
                            }
                          }
                        }}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Profile...
                          </>
                        ) : (
                          "Create Profile"
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
    </GuestOnlyRoute>
  );
}
