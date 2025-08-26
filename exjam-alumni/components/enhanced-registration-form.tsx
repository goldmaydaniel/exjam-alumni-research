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
import { Checkbox } from "@/components/ui/checkbox";
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
  Award,
  Medal,
  Eye,
} from "lucide-react";
import { useAuth } from "@/lib/store/consolidated-auth";
import { GuestOnlyRoute } from "@/components/auth/guest-only-route";
import { toast } from "sonner";
import { EnhancedPhotoCapture } from "@/components/enhanced-photo-capture";
import { DynamicProfilePhoto, ProfilePhotoGallery } from "@/components/dynamic-profile-photo";
import { DynamicBadge, generateBadge } from "@/components/dynamic-badge-generator";

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
    profilePhotoUrl: z.string().optional(),
    badgePhotoUrl: z.string().optional(),

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

    // Photo preferences
    generateBadgePhoto: z.boolean().default(true),
    usePhotoForBadge: z.boolean().default(true),

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
  ALPHA: { bg: "bg-yellow-50", border: "border-yellow-500", text: "text-yellow-700" },
  JAGUAR: { bg: "bg-blue-50", border: "border-blue-500", text: "text-blue-700" },
  MIG: { bg: "bg-green-50", border: "border-green-500", text: "text-green-700" },
  HERCULES: { bg: "bg-red-50", border: "border-red-500", text: "text-red-700" },
  DONIER: { bg: "bg-purple-50", border: "border-purple-500", text: "text-purple-700" },
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
      "Professional Profile Photo",
      "Digital Achievement Badge",
    ],
  },
};

export default function EnhancedRegistrationForm() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [badgePhotoUrl, setBadgePhotoUrl] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [skipAccount, setSkipAccount] = useState(false);
  const [showBadgePreview, setShowBadgePreview] = useState(false);
  const [previewBadge, setPreviewBadge] = useState<any>(null);

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
      generateBadgePhoto: true,
      usePhotoForBadge: true,
    },
  });

  const selectedSquadron = watch("squadron");
  const fullName = watch("fullName");
  const generateBadgePhoto = watch("generateBadgePhoto");

  // Clear error when changing steps
  useEffect(() => {
    setError(null);
    clearErrors();
  }, [currentStep, clearErrors]);

  // Ensure eventPackage and badgeType are always set
  useEffect(() => {
    setValue("eventPackage", "STANDARD");
    setValue("badgeType", "STANDARD");
  }, [setValue]);

  // Generate badge preview
  useEffect(() => {
    if (fullName && selectedSquadron && (profilePhotoUrl || badgePhotoUrl)) {
      const badge = {
        userId: "preview",
        type: "registration" as const,
        title: fullName,
        subtitle: `${selectedSquadron} Squadron`,
        description: "EXJAM Alumni Conference 2025 Participant",
        eventName: "EXJAM Alumni Conference 2025",
        eventDate: new Date("2025-03-29"),
        eventLocation: "Lagos, Nigeria",
        photoUrl: profilePhotoUrl || undefined,
        badgePhotoUrl: badgePhotoUrl || undefined,
        backgroundColor: squadronColors[selectedSquadron]?.bg.replace("bg-", "#") || "#f8fafc",
        accentColor: squadronColors[selectedSquadron]?.border.replace("border-", "#") || "#3b82f6",
      };

      generateBadge(badge).then(setPreviewBadge);
    }
  }, [fullName, selectedSquadron, profilePhotoUrl, badgePhotoUrl]);

  const calculateTotal = () => {
    return 20000; // Fixed price
  };

  const handlePhotoCapture = (data: any) => {
    if (data.profilePhotoUrl) {
      setProfilePhotoUrl(data.profilePhotoUrl);
      setValue("profilePhotoUrl", data.profilePhotoUrl);
    }

    if (data.badgePhotoUrl && generateBadgePhoto) {
      setBadgePhotoUrl(data.badgePhotoUrl);
      setValue("badgePhotoUrl", data.badgePhotoUrl);
    }

    setIsCameraActive(false);
    toast.success("Photos saved successfully!");
  };

  const autofillTestData = () => {
    setValue("fullName", "John Doe");
    setValue("serviceNumber", "AFMS 95/1234");
    setValue("squadron", "ALPHA");
    setValue("email", `sample${Date.now()}@exjam.test`);
    setValue("phone", "+2349087654321");
    setValue("chapter", "Lagos");
    setValue("currentLocation", "Lagos, Nigeria");
    setValue("emergencyContact", "Jane Doe - +2348123456789");
    setValue("arrivalDate", "2025-03-28");
    setValue("departureDate", "2025-03-30");
    setValue("expectations", "Looking forward to reconnecting with fellow alumni");
    setValue("password", "Password123!");
    setValue("confirmPassword", "Password123!");

    toast.success("Test data filled!");
  };

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof RegistrationFormData)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = ["fullName", "serviceNumber", "squadron"];
        break;
      case 2:
        fieldsToValidate = ["email", "phone", "chapter", "currentLocation", "emergencyContact"];
        break;
      case 3:
        fieldsToValidate = ["arrivalDate", "departureDate"];
        break;
      case 4:
        // Photo step - no validation required
        break;
      case 5:
        // Review step - no validation required
        break;
      default:
        break;
    }

    if (fieldsToValidate.length > 0) {
      const isValid = await trigger(fieldsToValidate);
      if (!isValid) return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, 6));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: RegistrationFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Add photo URLs to submission data
      const submissionData = {
        ...data,
        profilePhotoUrl,
        badgePhotoUrl: generateBadgePhoto ? badgePhotoUrl : undefined,
        total: calculateTotal(),
      };

      const endpoint = skipAccount ? "/api/auth/register" : "/api/auth/register/afms";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        toast.success("Registration successful! Check your email for payment instructions.");

        // Redirect after success
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      } else {
        setError(result.message || "Registration failed");
        toast.error(result.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("Network error. Please try again.");
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <GuestOnlyRoute>
        <Card className="mx-auto w-full max-w-2xl">
          <CardContent className="pt-6">
            <div className="space-y-4 text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
              <h2 className="text-2xl font-bold text-green-700">Registration Successful!</h2>
              <p className="text-muted-foreground">
                Your registration has been submitted successfully.
                {profilePhotoUrl && " Your profile photo has been saved."}
                {badgePhotoUrl && " Your badge photo has been generated."}
              </p>

              {previewBadge && (
                <div className="mt-6">
                  <h3 className="mb-4 text-lg font-semibold">Your Conference Badge</h3>
                  <div className="flex justify-center">
                    <DynamicBadge
                      badge={previewBadge}
                      size="md"
                      showDownload={true}
                      showShare={true}
                    />
                  </div>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                Redirecting to dashboard in a few seconds...
              </div>
            </div>
          </CardContent>
        </Card>
      </GuestOnlyRoute>
    );
  }

  return (
    <GuestOnlyRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto w-full max-w-4xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold">EXJAM Alumni Conference Registration</h1>
            <p className="text-muted-foreground">
              Complete your registration with professional photos
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                      step <= currentStep
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    } `}
                  >
                    {step}
                  </div>
                  <div className="ml-2 text-sm">
                    {step === 1 && "Personal"}
                    {step === 2 && "Contact"}
                    {step === 3 && "Event"}
                    {step === 4 && "Photos"}
                    {step === 5 && "Review"}
                    {step === 6 && "Payment"}
                  </div>
                  {step < 6 && (
                    <div
                      className={`mx-4 h-0.5 w-16 ${step < currentStep ? "bg-primary" : "bg-muted"} `}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 4: Photo Capture */}
            {currentStep === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Professional Photos
                  </CardTitle>
                  <CardDescription>
                    Capture professional photos for your profile and conference badge
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Photo Options */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Photo Settings</h3>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="generateBadge"
                          checked={generateBadgePhoto}
                          onCheckedChange={(checked) => setValue("generateBadgePhoto", !!checked)}
                        />
                        <Label htmlFor="generateBadge">Generate badge photo automatically</Label>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        {generateBadgePhoto
                          ? "Your photo will be optimized for both profile and badge use"
                          : "Photo will only be used for your profile"}
                      </div>
                    </div>

                    {/* Current Photos Display */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Current Photos</h3>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <DynamicProfilePhoto userId="preview" size="lg" />
                          <p className="mt-2 text-xs">Profile Photo</p>
                        </div>

                        {generateBadgePhoto && (
                          <div className="text-center">
                            <DynamicProfilePhoto
                              userId="preview"
                              size="lg"
                              showBadgeVersion={true}
                            />
                            <p className="mt-2 text-xs">Badge Photo</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Photo Capture Interface */}
                  {isCameraActive ? (
                    <EnhancedPhotoCapture
                      onCapture={handlePhotoCapture}
                      onCancel={() => setIsCameraActive(false)}
                      saveToStorage={true}
                      generateBadgePhoto={generateBadgePhoto}
                      userId="preview" // In real app, this would be the user's ID
                    />
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-center gap-4">
                        <Button type="button" onClick={() => setIsCameraActive(true)} size="lg">
                          <Camera className="mr-2 h-4 w-4" />
                          {profilePhotoUrl ? "Retake Photo" : "Take Photo"}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowBadgePreview(true)}
                          disabled={!previewBadge}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Preview Badge
                        </Button>
                      </div>

                      {!profilePhotoUrl && (
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            A professional photo will enhance your conference badge and profile.
                            Photos are automatically optimized and stored securely.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

                  {/* Badge Preview Modal */}
                  {showBadgePreview && previewBadge && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                      <div className="max-w-md rounded-lg bg-background p-6">
                        <h3 className="mb-4 text-lg font-semibold">Badge Preview</h3>
                        <DynamicBadge badge={previewBadge} size="md" />
                        <div className="mt-4 flex gap-2">
                          <Button variant="outline" onClick={() => setShowBadgePreview(false)}>
                            Close
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                disabled={currentStep === 1}
              >
                Previous
              </Button>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={autofillTestData}
                  className="text-xs"
                >
                  Fill Test Data
                </Button>

                {currentStep < 6 ? (
                  <Button type="button" onClick={handleNextStep}>
                    Next
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Complete Registration"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </GuestOnlyRoute>
  );
}
