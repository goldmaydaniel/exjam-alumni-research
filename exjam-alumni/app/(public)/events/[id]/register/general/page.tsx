"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  UserPlus,
  CreditCard,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  User,
  DollarSign,
  Loader2,
  Heart,
} from "lucide-react";
import toast from "react-hot-toast";

interface Event {
  id: string;
  title: string;
  price: number;
  earlyBirdPrice?: number;
  earlyBirdDeadline?: string;
}

export default function GeneralRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const eventId = params.id as string;

  // Form state
  const [formData, setFormData] = useState({
    // Personal Info
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    organization: "",
    // Additional Info
    relationship: "",
    specialRequests: "",
    // Payment Info
    paymentMethod: "card",
  });

  useEffect(() => {
    if (eventId) {
      fetchEvent(eventId);
    }
  }, [eventId]);

  const fetchEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/events/${id}`);
      if (!response.ok) throw new Error("Failed to fetch event");
      const data = await response.json();
      setEvent(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load event details");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate personal info
      if (!formData.firstName || !formData.lastName || !formData.email) {
        toast.error("Please fill in all required fields");
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Mock registration + payment process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success("Registration and payment successful!");
      router.push(`/events/${eventId}/confirmation?type=general`);
    } catch (error) {
      toast.error("Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container py-16 text-center">
        <h2 className="mb-4 text-2xl font-bold">Event Not Found</h2>
        <Button onClick={() => router.push("/events")}>Back to Events</Button>
      </div>
    );
  }

  const isEarlyBird = event.earlyBirdDeadline && new Date(event.earlyBirdDeadline) > new Date();
  const currentPrice = isEarlyBird && event.earlyBirdPrice ? event.earlyBirdPrice : event.price;
  const progress = (currentStep / 3) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/events/${eventId}/register`)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Registration Options
          </Button>

          <div className="text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <UserPlus className="h-8 w-8 text-gray-600" />
            </div>
            <h1 className="mb-2 text-3xl font-bold">General Registration</h1>
            <p className="text-muted-foreground">
              Register for {event.title} as a supporter or guest
            </p>
            <Badge className="mt-2" variant="outline">
              ₦{currentPrice.toLocaleString()}
              {isEarlyBird && " (Early Bird)"}
            </Badge>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="mb-2 flex justify-between text-sm text-gray-600">
            <span>Step {currentStep} of 3</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="mt-2 flex justify-between text-xs text-gray-500">
            <span className={currentStep >= 1 ? "font-medium text-gray-600" : ""}>
              Personal Info
            </span>
            <span className={currentStep >= 2 ? "font-medium text-gray-600" : ""}>
              Additional Details
            </span>
            <span className={currentStep >= 3 ? "font-medium text-gray-600" : ""}>Payment</span>
          </div>
        </div>

        {/* Form Steps */}
        <Card className="border-2 border-gray-100">
          <CardContent className="p-8">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="mb-6 text-center">
                  <User className="mx-auto mb-2 h-12 w-12 text-gray-500" />
                  <h3 className="text-xl font-semibold">Personal Information</h3>
                  <p className="text-gray-600">Tell us about yourself</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="Your first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder="Your last name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="+234 XXX XXX XXXX"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="organization">Organization/Company</Label>
                    <Input
                      id="organization"
                      value={formData.organization}
                      onChange={(e) => handleInputChange("organization", e.target.value)}
                      placeholder="Your organization or company"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleNext} className="bg-gray-600 hover:bg-gray-700">
                    Continue to Additional Details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Additional Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="mb-6 text-center">
                  <Heart className="mx-auto mb-2 h-12 w-12 text-gray-500" />
                  <h3 className="text-xl font-semibold">Additional Details</h3>
                  <p className="text-gray-600">Help us serve you better</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="relationship">Relationship to AFMS</Label>
                    <Input
                      id="relationship"
                      value={formData.relationship}
                      onChange={(e) => handleInputChange("relationship", e.target.value)}
                      placeholder="e.g., Family member, Friend, Supporter, Media, etc."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      This helps us understand our attendee demographics
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="specialRequests">
                      Special Requests or Dietary Requirements
                    </Label>
                    <Textarea
                      id="specialRequests"
                      value={formData.specialRequests}
                      onChange={(e) => handleInputChange("specialRequests", e.target.value)}
                      placeholder="Any accessibility needs, dietary restrictions, or special accommodations..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-green-50 p-4">
                  <h4 className="mb-2 font-medium text-green-800">What's Included:</h4>
                  <ul className="space-y-1 text-sm text-green-700">
                    <li>• Full access to all event sessions</li>
                    <li>• Welcome package and event materials</li>
                    <li>• Networking opportunities with alumni and guests</li>
                    <li>• Certificate of attendance</li>
                    <li>• Refreshments and meals (as scheduled)</li>
                  </ul>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleNext} className="bg-gray-600 hover:bg-gray-700">
                    Continue to Payment
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="mb-6 text-center">
                  <CreditCard className="mx-auto mb-2 h-12 w-12 text-gray-500" />
                  <h3 className="text-xl font-semibold">Complete Payment</h3>
                  <p className="text-gray-600">Secure your spot at {event.title}</p>
                </div>

                <div className="mb-6 rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Registration Fee:</span>
                    <span className="text-2xl font-bold text-gray-600">
                      ₦{currentPrice.toLocaleString()}
                    </span>
                  </div>
                  {isEarlyBird && (
                    <p className="mt-1 text-sm text-gray-600">
                      🎉 You saved ₦{(event.price - currentPrice).toLocaleString()} with Early Bird
                      pricing!
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Payment Method</Label>
                    <div className="mt-2 grid gap-2">
                      <Button
                        variant={formData.paymentMethod === "card" ? "default" : "outline"}
                        onClick={() => handleInputChange("paymentMethod", "card")}
                        className="justify-start"
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Credit/Debit Card
                      </Button>
                      <Button
                        variant={formData.paymentMethod === "transfer" ? "default" : "outline"}
                        onClick={() => handleInputChange("paymentMethod", "transfer")}
                        className="justify-start"
                      >
                        <DollarSign className="mr-2 h-4 w-4" />
                        Bank Transfer
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-gray-50 p-4">
                    <h4 className="mb-2 font-medium">Registration Summary</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>
                        Name: {formData.firstName} {formData.lastName}
                      </div>
                      <div>Email: {formData.email}</div>
                      <div>Organization: {formData.organization || "Not specified"}</div>
                      <div>Type: General Registration</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Complete Registration & Payment
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
