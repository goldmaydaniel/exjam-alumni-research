"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { SmartPhotoCapture } from "@/components/smart-photo-capture";
import {
  Users,
  Phone,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Sparkles,
  Plane,
  MessageSquare,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";

const yearOptions = Array.from({ length: 45 }, (_, i) => 1980 + i);
const squadrons = [
  { value: "green", label: "Green Squadron", color: "text-green-600" },
  { value: "red", label: "Red Squadron", color: "text-red-600" },
  { value: "purple", label: "Purple Squadron", color: "text-purple-600" },
  { value: "yellow", label: "Yellow Squadron", color: "text-yellow-600" },
  { value: "dornier", label: "Dornier Squadron", color: "text-blue-600" },
  { value: "puma", label: "Puma Squadron", color: "text-gray-600" },
];

const chapters = [
  "Abuja FCT",
  "Lagos",
  "Jos",
  "Kaduna",
  "Port Harcourt",
  "Kano",
  "Enugu",
  "Ibadan",
  "International",
  "Other",
];

export default function PGConferenceWizardForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [bankDetails, setBankDetails] = useState<{
    bankName: string;
    accountName: string;
    accountNumber: string;
    amount: string;
    reference: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    serviceNumber: "",
    graduationYear: "",
    squadron: "",
    email: "",
    phone: "",
    chapter: "",
    currentLocation: "",
    emergencyContact: "",
    arrivalDate: "",
    departureDate: "",
    expectations: "",
    comments: "",
    profilePhoto: "",
  });

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/events/pg-conference/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setBankDetails(data.bankDetails);
        setRegistrationComplete(true);
      } else {
        alert(data.error || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const steps = [
    { number: 1, title: "Alumni Info", icon: Users },
    { number: 2, title: "Contact", icon: Phone },
    { number: 3, title: "Photo", icon: Camera },
    { number: 4, title: "Travel Plans", icon: Plane },
    { number: 5, title: "Final Details", icon: MessageSquare },
  ];

  // Show success page with bank details after registration
  if (registrationComplete && bankDetails) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <Card>
          <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-8 w-8" />
              <div>
                <CardTitle className="text-2xl">Registration Successful!</CardTitle>
                <CardDescription className="text-white/90">
                  Your registration for PG Conference 2025 is pending payment
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {/* Badge Status */}
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <span className="font-semibold text-yellow-800">Badge Status: PENDING</span>
              </div>
              <p className="text-sm text-yellow-700">
                Your badge will be upgraded to FULL status after payment confirmation
              </p>
            </div>

            {/* Bank Details */}
            <div className="space-y-4 rounded-lg bg-gray-50 p-6">
              <h3 className="mb-4 text-lg font-bold">Bank Payment Details</h3>

              <div className="grid gap-3">
                <div className="flex justify-between border-b py-2">
                  <span className="text-gray-600">Bank Name:</span>
                  <span className="font-semibold">{bankDetails.bankName}</span>
                </div>
                <div className="flex justify-between border-b py-2">
                  <span className="text-gray-600">Account Name:</span>
                  <span className="font-semibold">{bankDetails.accountName}</span>
                </div>
                <div className="flex justify-between border-b py-2">
                  <span className="text-gray-600">Account Number:</span>
                  <span className="font-mono text-lg font-bold">{bankDetails.accountNumber}</span>
                </div>
                <div className="flex justify-between border-b py-2">
                  <span className="text-gray-600">Amount:</span>
                  <span className="text-xl font-bold text-green-600">{bankDetails.amount}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Payment Reference:</span>
                  <span className="font-mono font-bold text-blue-600">{bankDetails.reference}</span>
                </div>
              </div>

              <div className="mt-4 rounded border border-blue-200 bg-blue-50 p-3">
                <p className="text-sm text-blue-800">
                  <strong>Important:</strong> Please use the payment reference above when making
                  your transfer. This helps us identify and confirm your payment quickly.
                </p>
              </div>
            </div>

            {/* Next Steps */}
            <div className="space-y-3">
              <h3 className="font-semibold">Next Steps:</h3>
              <ol className="list-inside list-decimal space-y-2 text-sm text-gray-600">
                <li>Make payment to the bank account above</li>
                <li>Keep your payment receipt for confirmation</li>
                <li>Your badge status will be updated to FULL within 24 hours</li>
                <li>You&apos;ll receive a confirmation email with your conference badge</li>
              </ol>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={() => window.print()} variant="outline" className="flex-1">
                Print Details
              </Button>
              <Link href="/dashboard" className="flex-1">
                <Button className="w-full">Go to Dashboard</Button>
              </Link>
            </div>

            {/* Contact */}
            <div className="border-t pt-4 text-center text-sm text-gray-600">
              Need help? Contact us at{" "}
              <a href="mailto:info@exjam.org.ng" className="text-blue-600 hover:underline">
                info@exjam.org.ng
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      {/* Header Banner */}
      <div className="rounded-t-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              <Sparkles className="h-8 w-8" />
              President General&apos;s Conference - Maiden Flight
            </h1>
            <p className="mt-2 opacity-90">Registration for PG Conference 2025 • Nov 28-30, 2025</p>
          </div>
          <div className="hidden text-right md:block">
            <p className="text-sm opacity-75">NAF Conference Centre</p>
            <p className="text-lg font-semibold">Abuja, FCT</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="border-x border-gray-200 bg-white px-6 pt-6">
        <div className="mb-4 flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;

            return (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300",
                      isActive && "scale-110 bg-blue-600 text-white",
                      isCompleted && "bg-green-500 text-white",
                      !isActive && !isCompleted && "bg-gray-200 text-gray-400"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-xs font-medium",
                      isActive && "text-blue-600",
                      isCompleted && "text-green-600",
                      !isActive && !isCompleted && "text-gray-400"
                    )}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "mx-2 h-1 w-full max-w-[100px] transition-all duration-300",
                      currentStep > step.number ? "bg-green-500" : "bg-gray-200"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Form Card */}
      <Card className="rounded-t-none border-t-0">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Alumni Information */}
            {currentStep === 1 && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <h2 className="mb-2 text-2xl font-bold">
                    Let&apos;s start with your alumni details
                  </h2>
                  <p className="text-gray-600">Tell us about your AFMS background</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="As it appears on official documents"
                      className="p-6 text-lg"
                      required
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="serviceNumber">Service Number</Label>
                      <Input
                        id="serviceNumber"
                        name="serviceNumber"
                        value={formData.serviceNumber}
                        onChange={handleChange}
                        placeholder="Your AFMS service number"
                        className="p-6"
                      />
                    </div>

                    <div>
                      <Label htmlFor="graduationYear">Set *</Label>
                      <Select
                        onValueChange={(value) => handleSelectChange("graduationYear", value)}
                        required
                      >
                        <SelectTrigger className="p-6">
                          <SelectValue placeholder="Select your set" />
                        </SelectTrigger>
                        <SelectContent>
                          {yearOptions.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year.toString().slice(-2)} Set
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Squadron *</Label>
                    <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-3">
                      {squadrons.map((squadron) => (
                        <button
                          key={squadron.value}
                          type="button"
                          onClick={() => handleSelectChange("squadron", squadron.value)}
                          className={cn(
                            "rounded-lg border-2 p-4 transition-all duration-200",
                            formData.squadron === squadron.value
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                        >
                          <span
                            className={cn(
                              "font-semibold",
                              formData.squadron === squadron.value
                                ? "text-blue-700"
                                : squadron.color
                            )}
                          >
                            {squadron.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Contact Information */}
            {currentStep === 2 && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <h2 className="mb-2 text-2xl font-bold">How can we reach you?</h2>
                  <p className="text-gray-600">
                    We&apos;ll use this to send important conference updates
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your.email@example.com"
                      className="p-6 text-lg"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+234 801 234 5678"
                      className="p-6 text-lg"
                      required
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="chapter">Chapter *</Label>
                      <Select
                        onValueChange={(value) => handleSelectChange("chapter", value)}
                        required
                      >
                        <SelectTrigger className="p-6">
                          <SelectValue placeholder="Select chapter" />
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

                    <div>
                      <Label htmlFor="currentLocation">Current City *</Label>
                      <Input
                        id="currentLocation"
                        name="currentLocation"
                        value={formData.currentLocation}
                        onChange={handleChange}
                        placeholder="e.g., Lagos, Nigeria"
                        className="p-6"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="emergencyContact">Emergency Contact *</Label>
                    <Input
                      id="emergencyContact"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleChange}
                      placeholder="Name and phone number"
                      className="p-6"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Photo Capture */}
            {currentStep === 3 && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <h2 className="mb-2 text-2xl font-bold">Let&apos;s capture your photo</h2>
                  <p className="text-gray-600">
                    We&apos;ll use this for your conference badge and membership profile
                  </p>
                </div>

                <div className="space-y-4">
                  {!showPhotoCapture && !formData.profilePhoto && (
                    <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                      <Camera className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                      <p className="mb-4 text-gray-600">
                        Your photo will be used for your conference badge
                      </p>
                      <Button
                        type="button"
                        onClick={() => setShowPhotoCapture(true)}
                        className="gap-2"
                      >
                        <Camera className="h-4 w-4" />
                        Open Camera
                      </Button>
                    </div>
                  )}

                  {showPhotoCapture && (
                    <SmartPhotoCapture
                      onCapture={(imageData) => {
                        setFormData({ ...formData, profilePhoto: imageData });
                        setShowPhotoCapture(false);
                      }}
                      onCancel={() => setShowPhotoCapture(false)}
                    />
                  )}

                  {formData.profilePhoto && !showPhotoCapture && (
                    <div className="space-y-4">
                      <div className="relative inline-block">
                        <Image
                          src={formData.profilePhoto}
                          alt="Profile"
                          width={192}
                          height={192}
                          className="h-48 w-48 rounded-lg border-2 border-gray-200 object-cover"
                        />
                        <div className="absolute -right-2 -top-2 rounded-full bg-green-500 p-1 text-white">
                          <CheckCircle className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowPhotoCapture(true)}
                          className="gap-2"
                        >
                          <Camera className="h-4 w-4" />
                          Retake Photo
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Travel Plans */}
            {currentStep === 4 && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <h2 className="mb-2 text-2xl font-bold">Plan your conference journey</h2>
                  <p className="text-gray-600">Help us prepare for your arrival</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label>When will you arrive? *</Label>
                    <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
                      {[
                        { value: "nov27", label: "Nov 27, 2025", desc: "Day before conference" },
                        { value: "nov28", label: "Nov 28, 2025", desc: "Conference start day" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleSelectChange("arrivalDate", option.value)}
                          className={cn(
                            "rounded-lg border-2 p-4 text-left transition-all duration-200",
                            formData.arrivalDate === option.value
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                        >
                          <div className="font-semibold">{option.label}</div>
                          <div className="text-sm text-gray-600">{option.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>When will you depart? *</Label>
                    <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
                      {[
                        { value: "nov30", label: "Nov 30, 2025", desc: "Conference end day" },
                        { value: "dec1", label: "Dec 1, 2025", desc: "Day after conference" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleSelectChange("departureDate", option.value)}
                          className={cn(
                            "rounded-lg border-2 p-4 text-left transition-all duration-200",
                            formData.departureDate === option.value
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                        >
                          <div className="font-semibold">{option.label}</div>
                          <div className="text-sm text-gray-600">{option.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Final Details */}
            {currentStep === 5 && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <h2 className="mb-2 text-2xl font-bold">Almost done!</h2>
                  <p className="text-gray-600">Share your expectations (optional)</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="expectations">
                      What are you looking forward to at the conference?
                    </Label>
                    <Textarea
                      id="expectations"
                      name="expectations"
                      value={formData.expectations}
                      onChange={handleChange}
                      placeholder="Share your goals and expectations..."
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  {/* Summary Review */}
                  <div className="space-y-2 rounded-lg bg-gray-50 p-4">
                    <h3 className="mb-3 font-semibold text-gray-900">Quick Review</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-600">Name:</div>
                      <div className="font-medium">{formData.fullName || "Not provided"}</div>
                      <div className="text-gray-600">Squadron:</div>
                      <div className="font-medium">
                        {squadrons.find((s) => s.value === formData.squadron)?.label ||
                          "Not selected"}
                      </div>
                      <div className="text-gray-600">Arrival:</div>
                      <div className="font-medium">
                        {formData.arrivalDate === "nov27"
                          ? "Nov 27, 2025"
                          : formData.arrivalDate === "nov28"
                            ? "Nov 28, 2025"
                            : "Not selected"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>

              {currentStep < totalSteps ? (
                <Button type="button" onClick={handleNext} className="gap-2">
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {isSubmitting ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Complete Registration
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Help Text */}
      <div className="mt-6 text-center text-sm text-gray-600">
        Need help? Contact us at{" "}
        <a href="mailto:info@exjam.org.ng" className="text-blue-600 hover:underline">
          info@exjam.org.ng
        </a>
      </div>
    </div>
  );
}
