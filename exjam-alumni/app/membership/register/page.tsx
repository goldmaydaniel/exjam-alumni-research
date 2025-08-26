"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import toast from "react-hot-toast";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Shield,
  Calendar,
  CreditCard,
  Info,
  Check,
  Star,
  Loader2,
  GraduationCap,
} from "lucide-react";

const membershipSchema = z
  .object({
    // Personal Information
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),

    // AFMS Information
    serviceNumber: z
      .string()
      .min(1, "Service number is required")
      .regex(/^AFMS\s?\d{2,4}\/\d{4}$/i, "Format: AFMS 95/2000"),
    squadron: z.enum(["GREEN", "RED", "PURPLE", "YELLOW", "DORNIER", "PUMA"]),
    graduationYear: z.string().min(4, "Graduation year is required"),

    // Current Information
    currentLocation: z.string().min(3, "Location is required"),
    country: z.string().default("Nigeria"),
    occupation: z.string().min(3, "Occupation is required"),
    company: z.string().optional(),

    // Chapter Selection
    chapter: z.string().min(1, "Please select a chapter"),

    // Membership Type
    membershipType: z.enum(["annual", "lifetime", "student"]),

    // Payment Method
    paymentMethod: z.enum(["card", "transfer"]),

    // Password
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),

    // Terms
    agreeToTerms: z.boolean().refine((val) => val === true, "You must agree to terms"),
    receiveUpdates: z.boolean().default(true),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type MembershipFormData = z.infer<typeof membershipSchema>;

const CHAPTERS = [
  "Abuja Chapter",
  "Lagos Chapter",
  "Port Harcourt Chapter",
  "Kaduna Chapter",
  "Jos Chapter",
  "International Chapter",
];

const SQUADRONS = [
  { value: "GREEN", label: "Green Squadron", color: "bg-green-500" },
  { value: "RED", label: "Red Squadron", color: "bg-red-500" },
  { value: "PURPLE", label: "Purple Squadron", color: "bg-purple-500" },
  { value: "YELLOW", label: "Yellow Squadron", color: "bg-yellow-500" },
  { value: "DORNIER", label: "Dornier Squadron", color: "bg-blue-500" },
  { value: "PUMA", label: "Puma Squadron", color: "bg-gray-600" },
];

const MEMBERSHIP_PRICES = {
  annual: { label: "Annual Membership", price: "₦10,000", period: "/year" },
  lifetime: { label: "Lifetime Membership", price: "₦150,000", period: "one-time" },
  student: { label: "Student Membership", price: "₦5,000", period: "/year" },
};

export default function MembershipRegistrationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MembershipFormData>({
    resolver: zodResolver(membershipSchema),
    defaultValues: {
      country: "Nigeria",
      membershipType: "annual",
      paymentMethod: "card",
      receiveUpdates: true,
    },
  });

  const membershipType = watch("membershipType");
  const squadron = watch("squadron");

  const onSubmit = async (data: MembershipFormData) => {
    setIsSubmitting(true);
    try {
      // First create the user account
      const registerResponse = await fetch("/api/auth/register/enhanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
          phone: data.phone,
          serviceNumber: data.serviceNumber,
          squadron: data.squadron,
          graduationYear: data.graduationYear,
          chapter: data.chapter,
          currentLocation: data.currentLocation,
          country: data.country,
          occupation: data.occupation,
          company: data.company,
          membershipType: data.membershipType,
          isMembershipRegistration: true,
        }),
      });

      if (!registerResponse.ok) {
        throw new Error("Registration failed");
      }

      // Then process membership payment
      const paymentResponse = await fetch("/api/membership/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipType: data.membershipType,
          paymentMethod: data.paymentMethod,
          email: data.email,
          amount: MEMBERSHIP_PRICES[data.membershipType].price,
        }),
      });

      if (!paymentResponse.ok) {
        throw new Error("Payment processing failed");
      }

      toast.success("Membership registration successful! Redirecting to payment...");

      // Redirect to payment or dashboard
      if (data.paymentMethod === "card") {
        router.push("/payment?type=membership");
      } else {
        router.push("/dashboard?welcome=true&payment=transfer");
      }
    } catch (error) {
      toast.error("Registration failed. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, totalSteps));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="container max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">EXJAM Membership Registration</h1>
            <Badge variant="outline">
              Step {step} of {totalSteps}
            </Badge>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            {/* Step 1: Personal Information */}
            {step === 1 && (
              <>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>Let's start with your basic information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input id="firstName" placeholder="John" {...register("firstName")} />
                      {errors.firstName && (
                        <p className="text-sm text-destructive">{errors.firstName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input id="lastName" placeholder="Doe" {...register("lastName")} />
                      {errors.lastName && (
                        <p className="text-sm text-destructive">{errors.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      <Mail className="mr-1 inline h-4 w-4" />
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.doe@example.com"
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      <Phone className="mr-1 inline h-4 w-4" />
                      Phone Number *
                    </Label>
                    <Input id="phone" placeholder="+234 801 234 5678" {...register("phone")} />
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone.message}</p>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="currentLocation">
                        <MapPin className="mr-1 inline h-4 w-4" />
                        Current Location *
                      </Label>
                      <Input
                        id="currentLocation"
                        placeholder="Lagos, Nigeria"
                        {...register("currentLocation")}
                      />
                      {errors.currentLocation && (
                        <p className="text-sm text-destructive">{errors.currentLocation.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input id="country" placeholder="Nigeria" {...register("country")} />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="occupation">
                        <Building className="mr-1 inline h-4 w-4" />
                        Occupation *
                      </Label>
                      <Input id="occupation" placeholder="Pilot" {...register("occupation")} />
                      {errors.occupation && (
                        <p className="text-sm text-destructive">{errors.occupation.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company (Optional)</Label>
                      <Input
                        id="company"
                        placeholder="Nigerian Air Force"
                        {...register("company")}
                      />
                    </div>
                  </div>
                </CardContent>
              </>
            )}

            {/* Step 2: AFMS Information */}
            {step === 2 && (
              <>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    AFMS Information
                  </CardTitle>
                  <CardDescription>Your Air Force Military School details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="serviceNumber">
                      <Shield className="mr-1 inline h-4 w-4" />
                      Service Number *
                    </Label>
                    <Input
                      id="serviceNumber"
                      placeholder="AFMS 95/2000"
                      {...register("serviceNumber")}
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: AFMS XX/YYYY (e.g., AFMS 95/2000)
                    </p>
                    {errors.serviceNumber && (
                      <p className="text-sm text-destructive">{errors.serviceNumber.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Squadron *</Label>
                    <RadioGroup
                      value={squadron}
                      onValueChange={(value) => setValue("squadron", value as any)}
                    >
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                        {SQUADRONS.map((sq) => (
                          <div key={sq.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={sq.value} id={sq.value} />
                            <Label
                              htmlFor={sq.value}
                              className="flex cursor-pointer items-center gap-2"
                            >
                              <div className={`h-3 w-3 rounded-full ${sq.color}`} />
                              {sq.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                    {errors.squadron && (
                      <p className="text-sm text-destructive">Please select your squadron</p>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="graduationYear">
                        <Calendar className="mr-1 inline h-4 w-4" />
                        Graduation Year *
                      </Label>
                      <Input
                        id="graduationYear"
                        placeholder="2000"
                        {...register("graduationYear")}
                      />
                      {errors.graduationYear && (
                        <p className="text-sm text-destructive">{errors.graduationYear.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="chapter">Chapter *</Label>
                      <Select
                        value={watch("chapter")}
                        onValueChange={(value) => setValue("chapter", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your chapter" />
                        </SelectTrigger>
                        <SelectContent>
                          {CHAPTERS.map((chapter) => (
                            <SelectItem key={chapter} value={chapter}>
                              {chapter}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.chapter && (
                        <p className="text-sm text-destructive">{errors.chapter.message}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </>
            )}

            {/* Step 3: Membership Selection */}
            {step === 3 && (
              <>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Select Membership Type
                  </CardTitle>
                  <CardDescription>Choose your membership plan and payment method</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <RadioGroup
                    value={membershipType}
                    onValueChange={(value) => setValue("membershipType", value as any)}
                  >
                    <div className="space-y-4">
                      {Object.entries(MEMBERSHIP_PRICES).map(([key, value]) => (
                        <div
                          key={key}
                          className={`cursor-pointer rounded-lg border p-4 transition-all ${
                            membershipType === key
                              ? "border-blue-500 bg-blue-50"
                              : "hover:border-gray-400"
                          }`}
                          onClick={() => setValue("membershipType", key as any)}
                        >
                          <div className="flex items-start space-x-3">
                            <RadioGroupItem value={key} id={key} />
                            <div className="flex-1">
                              <Label htmlFor={key} className="cursor-pointer">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="font-semibold">{value.label}</div>
                                    <div className="mt-1 text-2xl font-bold">
                                      {value.price}
                                      <span className="ml-1 text-sm text-muted-foreground">
                                        {value.period}
                                      </span>
                                    </div>
                                  </div>
                                  {key === "lifetime" && (
                                    <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600">
                                      Best Value
                                    </Badge>
                                  )}
                                </div>
                              </Label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <RadioGroup
                      value={watch("paymentMethod")}
                      onValueChange={(value) => setValue("paymentMethod", value as any)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="card" id="card" />
                          <Label htmlFor="card" className="cursor-pointer">
                            Pay with Card (Instant)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="transfer" id="transfer" />
                          <Label htmlFor="transfer" className="cursor-pointer">
                            Bank Transfer (Manual verification)
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      {watch("paymentMethod") === "card"
                        ? "You will be redirected to our secure payment gateway after registration."
                        : "Bank details will be provided after registration. Membership will be activated upon payment confirmation."}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </>
            )}

            {/* Step 4: Account Security */}
            {step === 4 && (
              <>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Account Security
                  </CardTitle>
                  <CardDescription>Set up your account password</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      {...register("password")}
                    />
                    <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      {...register("confirmPassword")}
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="agreeToTerms"
                        checked={watch("agreeToTerms")}
                        onCheckedChange={(checked) => setValue("agreeToTerms", !!checked)}
                      />
                      <div className="space-y-1">
                        <Label htmlFor="agreeToTerms" className="cursor-pointer">
                          I agree to the Terms of Service and Privacy Policy *
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          By joining, you agree to our membership terms and conditions
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="receiveUpdates"
                        checked={watch("receiveUpdates")}
                        onCheckedChange={(checked) => setValue("receiveUpdates", !!checked)}
                      />
                      <div className="space-y-1">
                        <Label htmlFor="receiveUpdates" className="cursor-pointer">
                          Send me updates about EXJAM events and activities
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          You can unsubscribe at any time
                        </p>
                      </div>
                    </div>
                  </div>

                  {errors.agreeToTerms && (
                    <Alert variant="destructive">
                      <AlertDescription>You must agree to the terms to continue</AlertDescription>
                    </Alert>
                  )}

                  {/* Summary */}
                  <Card className="bg-gray-50">
                    <CardHeader>
                      <CardTitle className="text-lg">Registration Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Name:</span>
                        <span className="font-medium">
                          {watch("firstName")} {watch("lastName")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Service Number:</span>
                        <span className="font-medium">{watch("serviceNumber")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Squadron:</span>
                        <span className="font-medium">{watch("squadron")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Chapter:</span>
                        <span className="font-medium">{watch("chapter")}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold">
                        <span>Membership:</span>
                        <span>{MEMBERSHIP_PRICES[membershipType].label}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-blue-600">
                          {MEMBERSHIP_PRICES[membershipType].price}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </>
            )}

            <CardFooter className="flex justify-between">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={prevStep} disabled={isSubmitting}>
                  Previous
                </Button>
              )}

              {step < totalSteps ? (
                <Button type="button" onClick={nextStep} className="ml-auto">
                  Next
                  <Check className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="ml-auto bg-gradient-to-r from-blue-600 to-indigo-600"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Complete Registration
                      <Star className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        </form>

        {/* Help Text */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in here
            </Link>
          </p>
          <p className="mt-2">
            Need help? Contact us at{" "}
            <a href="mailto:membership@exjam.org" className="text-primary hover:underline">
              membership@exjam.org
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
