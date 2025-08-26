"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  ArrowLeft,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Loader2,
  CheckCircle,
  AlertCircle,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/store/consolidated-auth";

interface Event {
  id: string;
  title: string;
  shortDescription: string;
  startDate: string;
  endDate: string;
  venue: string;
  address: string;
  price: number;
  earlyBirdPrice?: number;
  earlyBirdDeadline?: string;
  capacity: number;
  _count: {
    registrations: number;
  };
}

interface FormData {
  // Account creation fields
  email: string;
  password: string;
  confirmPassword: string;

  // Personal details
  firstName: string;
  lastName: string;
  phone: string;

  // Alumni-specific fields
  serviceNumber: string;
  graduationYear: string;
  squadron: string;
  currentOccupation: string;
  company: string;

  // Event registration fields
  ticketType: "REGULAR" | "VIP" | "STUDENT";
  specialRequests: string;

  // Agreement
  agreeToTerms: boolean;
  agreeToMarketing: boolean;
}

export default function AlumniRegistrationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token } = useAuthStore();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExistingUser, setIsExistingUser] = useState(false);

  const eventId = searchParams.get("event");
  const returnUrl = searchParams.get("return") || "/events";

  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    serviceNumber: "",
    graduationYear: "",
    squadron: "",
    currentOccupation: "",
    company: "",
    ticketType: "REGULAR",
    specialRequests: "",
    agreeToTerms: false,
    agreeToMarketing: false,
  });

  // Check if user is already authenticated
  useEffect(() => {
    if (user && token) {
      setIsExistingUser(true);
      // Pre-populate form with user data
      setFormData((prev) => ({
        ...prev,
        email: user.email || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        serviceNumber: user.serviceNumber || "",
        squadron: user.squadron || "",
        currentOccupation: user.currentOccupation || "",
        company: user.company || "",
      }));
    }
  }, [user, token]);

  // Fetch event details or redirect to main alumni registration
  useEffect(() => {
    if (!eventId) {
      // No event specified, redirect to main alumni registration
      router.replace("/register-alumni");
      return;
    }
    fetchEvent(eventId);
  }, [eventId, router]);

  const fetchEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/events/${id}`);
      if (!response.ok) throw new Error("Failed to fetch event");
      const data = await response.json();
      setEvent(data);
    } catch (err) {
      setError("Failed to load event details. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!isExistingUser) {
      if (!formData.email) errors.push("Email is required");
      if (!formData.password) errors.push("Password is required");
      if (formData.password !== formData.confirmPassword) errors.push("Passwords don't match");
      if (formData.password.length < 8) errors.push("Password must be at least 8 characters");
    }

    if (!formData.firstName) errors.push("First name is required");
    if (!formData.lastName) errors.push("Last name is required");
    if (!formData.phone) errors.push("Phone number is required");
    if (!formData.serviceNumber) errors.push("Service number is required");
    if (!formData.graduationYear) errors.push("Graduation year is required");
    if (!formData.squadron) errors.push("Squadron is required");
    if (!formData.agreeToTerms) errors.push("You must agree to the terms and conditions");

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }

    setSubmitting(true);

    try {
      if (isExistingUser) {
        // User is already authenticated, just register for event
        const response = await fetch("/api/registrations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            eventId,
            ticketType: formData.ticketType,
            specialRequests: formData.specialRequests,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Registration failed");
        }

        toast.success("Successfully registered for event!");
        router.push(`/events/${eventId}?registered=true`);
      } else {
        // Create account and register for event in one step
        const response = await fetch("/api/auth/register/alumni", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // Account creation
            email: formData.email,
            password: formData.password,

            // Personal details
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,

            // Alumni details
            serviceNumber: formData.serviceNumber,
            graduationYear: parseInt(formData.graduationYear),
            squadron: formData.squadron,
            currentOccupation: formData.currentOccupation,
            company: formData.company,

            // Event registration
            eventId,
            ticketType: formData.ticketType,
            specialRequests: formData.specialRequests,

            // Marketing consent
            marketingConsent: formData.agreeToMarketing,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Registration failed");
        }

        const data = await response.json();

        toast.success("Account created and event registration successful!");

        // Redirect to login or success page
        router.push(
          `/login?message=Account created successfully. Please check your email to verify your account.&redirect=${encodeURIComponent(`/events/${eventId}?registered=true`)}`
        );
      }
    } catch (err) {
      console.error("Registration error:", err);
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container py-16">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <h2 className="mb-4 text-2xl font-bold">Unable to Load Registration</h2>
          <p className="mb-6 text-muted-foreground">
            {error || "The event registration page couldn't be loaded."}
          </p>
          <Button onClick={() => router.push("/events")} variant="outline">
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  const spotsLeft = event.capacity - event._count.registrations;
  const isEarlyBird = event.earlyBirdDeadline && new Date(event.earlyBirdDeadline) > new Date();
  const currentPrice = isEarlyBird && event.earlyBirdPrice ? event.earlyBirdPrice : event.price;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <Button
            variant="ghost"
            className="mb-4 text-gray-600 hover:text-blue-600"
            onClick={() => router.push(returnUrl)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Event
          </Button>

          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600">
            <Shield className="h-8 w-8 text-white" />
          </div>

          <h1 className="mb-2 text-3xl font-bold">
            {isExistingUser ? "Register for Event" : "Alumni Registration"}
          </h1>

          <p className="text-gray-600">
            {isExistingUser
              ? "Complete your event registration"
              : "Create your alumni account and register for the event"}
          </p>
        </div>

        {/* Event Summary Card */}
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Calendar className="h-5 w-5" />
              {event.title}
            </CardTitle>
            <CardDescription className="text-blue-700">{event.shortDescription}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span>{formatDate(event.startDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-green-600" />
              <span>{event.venue}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-yellow-600" />
              <div>
                <span className="font-bold">{formatCurrency(currentPrice)}</span>
                {isEarlyBird && event.earlyBirdPrice && (
                  <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800">
                    Early Bird!
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-purple-800">{spotsLeft} spots left</span>
            </div>
          </CardContent>
        </Card>

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Registration Details
            </CardTitle>
            <CardDescription>
              {isExistingUser
                ? "Review your information and complete event registration"
                : "Fill in your details to create your alumni account and register for the event"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Account Creation Section (Only for new users) */}
              {!isExistingUser && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold">Account Creation</h3>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="+234 800 000 0000"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        placeholder="Minimum 8 characters"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        placeholder="Repeat password"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Personal Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <UserCheck className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold">Personal Information</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="John"
                      required
                      disabled={isExistingUser}
                    />
                  </div>

                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder="Doe"
                      required
                      disabled={isExistingUser}
                    />
                  </div>
                </div>

                {isExistingUser && (
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" value={formData.email} disabled className="bg-gray-50" />
                  </div>
                )}
              </div>

              {/* Alumni Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Alumni Information</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="serviceNumber">Service Number *</Label>
                    <Input
                      id="serviceNumber"
                      value={formData.serviceNumber}
                      onChange={(e) => handleInputChange("serviceNumber", e.target.value)}
                      placeholder="AF/12345"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="graduationYear">Graduation Year *</Label>
                    <Input
                      id="graduationYear"
                      type="number"
                      value={formData.graduationYear}
                      onChange={(e) => handleInputChange("graduationYear", e.target.value)}
                      placeholder="2020"
                      min="1960"
                      max={new Date().getFullYear()}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="squadron">Squadron *</Label>
                    <Input
                      id="squadron"
                      value={formData.squadron}
                      onChange={(e) => handleInputChange("squadron", e.target.value)}
                      placeholder="Alpha Squadron"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="currentOccupation">Current Occupation</Label>
                    <Input
                      id="currentOccupation"
                      value={formData.currentOccupation}
                      onChange={(e) => handleInputChange("currentOccupation", e.target.value)}
                      placeholder="Software Engineer"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="company">Company/Organization</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => handleInputChange("company", e.target.value)}
                    placeholder="Tech Corp Nigeria"
                  />
                </div>
              </div>

              {/* Event Registration Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold">Event Registration</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="ticketType">Ticket Type</Label>
                    <Select
                      value={formData.ticketType}
                      onValueChange={(value) => handleInputChange("ticketType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ticket type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="REGULAR">
                          Regular - {formatCurrency(currentPrice)}
                        </SelectItem>
                        <SelectItem value="VIP">
                          VIP - {formatCurrency(currentPrice * 1.5)}
                        </SelectItem>
                        <SelectItem value="STUDENT">
                          Student - {formatCurrency(currentPrice * 0.5)}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
                  <Textarea
                    id="specialRequests"
                    value={formData.specialRequests}
                    onChange={(e) => handleInputChange("specialRequests", e.target.value)}
                    placeholder="Dietary requirements, accessibility needs, etc."
                    rows={3}
                  />
                </div>
              </div>

              {/* Agreements */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => handleInputChange("agreeToTerms", !!checked)}
                    required
                  />
                  <Label htmlFor="agreeToTerms" className="text-sm">
                    I agree to the{" "}
                    <Link href="/terms" className="text-blue-600 hover:underline">
                      Terms and Conditions
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-blue-600 hover:underline">
                      Privacy Policy
                    </Link>{" "}
                    *
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agreeToMarketing"
                    checked={formData.agreeToMarketing}
                    onCheckedChange={(checked) => handleInputChange("agreeToMarketing", !!checked)}
                  />
                  <Label htmlFor="agreeToMarketing" className="text-sm">
                    I agree to receive marketing communications about future events and alumni
                    activities
                  </Label>
                </div>
              </div>

              {/* Pricing Summary */}
              <Card className="bg-gray-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Total Amount:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatCurrency(
                        formData.ticketType === "VIP"
                          ? currentPrice * 1.5
                          : formData.ticketType === "STUDENT"
                            ? currentPrice * 0.5
                            : currentPrice
                      )}
                    </span>
                  </div>
                  {isEarlyBird && event.earlyBirdPrice && (
                    <p className="mt-2 text-sm text-green-600">
                      ✨ Early Bird discount applied! Save{" "}
                      {formatCurrency(event.price - event.earlyBirdPrice)}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={submitting}
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Registration...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {isExistingUser ? "Register for Event" : "Create Account & Register"}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
