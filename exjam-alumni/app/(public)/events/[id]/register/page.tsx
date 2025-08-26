"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Users,
  Shield,
  Loader2,
  CreditCard,
  Check,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

// Registration schema - Eventbrite style
const registrationSchema = z.object({
  // Personal Info
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"), 
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Phone number is required"),
  
  // Alumni Info
  scvNo: z.string().min(2, "SCV No is required"),
  squadron: z.string().min(2, "Squadron is required"),
  currentLocation: z.string().min(2, "Current location is required"),
  
  // Optional
  emergencyContact: z.string().optional(),
  
  // Terms
  emailUpdates: z.boolean().default(true),
});

type RegistrationForm = z.infer<typeof registrationSchema>;

const event = {
  id: "pg-conference-2025",
  title: "President General's Conference - Maiden Flight",
  shortDescription: "A historic gathering of ExJAM alumni, leaders, and stakeholders",
  startDate: "2025-11-28T09:00:00.000Z",
  endDate: "2025-11-30T18:00:00.000Z", 
  venue: "NAF Conference Centre, FCT, ABUJA",
  address: "Nigerian Air Force Conference Centre, Abuja, FCT, Nigeria",
  price: 20000,
  features: [
    "Full event access & materials"
  ]
};

export default function StreamlinedRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');

  const eventId = params.id as string;

  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      emailUpdates: true,
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      weekday: "long",
      day: "numeric", 
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const onSubmit = async (data: RegistrationForm) => {
    setIsSubmitting(true);
    
    try {
      // Simulate registration API call
      console.log('Registration data:', data);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Move to payment step
      setStep('payment');
      toast.success("Registration details confirmed! Processing payment...");
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setStep('success');
      toast.success("Registration successful! Welcome to PG Conference 2025!");
      
    } catch (error: any) {
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Registration Confirmed!</h1>
          <p className="text-gray-600 mb-6">
            Your registration for PG Conference 2025 has been confirmed. 
            Check your email for your ticket and event details.
          </p>
          <div className="space-y-3">
            <Button onClick={() => router.push('/events')} className="w-full">
              View My Events
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
              className="w-full"
            >
              Back to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (step === 'payment') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Processing Payment</h1>
          <p className="text-gray-600 mb-6">
            Please wait while we process your payment of ₦{event.price.toLocaleString()}...
          </p>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Do not close this window</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href={`/events/${eventId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Event
              </Button>
            </Link>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="w-4 h-4 text-green-600" />
              Secure Registration
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-8">
            
            {/* Event Summary - Left Side */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">{event.title}</h1>
                    <p className="text-gray-600 mt-2">{event.shortDescription}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="font-semibold">{formatDate(event.startDate)}</div>
                        <div className="text-gray-600">{formatTime(event.startDate)} - {formatTime(event.endDate)}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-green-600" />
                      <div>
                        <div className="font-semibold">{event.venue}</div>
                        <div className="text-gray-600">{event.address}</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-semibold text-gray-900 mb-3">What's Included</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {event.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Check className="w-3 h-3 text-green-600" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Price Summary */}
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Conference Ticket</span>
                    <span>₦{event.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Processing Fee</span>
                    <span>Included</span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₦{event.price.toLocaleString()}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Registration Form - Right Side */}
            <div className="lg:col-span-3">
              <Card className="p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Complete Your Registration</h2>
                  <p className="text-gray-600 mt-1">Quick and secure - just like Eventbrite!</p>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          {...form.register("firstName")}
                          className="mt-1"
                          placeholder="Your first name"
                        />
                        {form.formState.errors.firstName && (
                          <p className="text-red-600 text-sm mt-1">{form.formState.errors.firstName.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          {...form.register("lastName")}
                          className="mt-1"
                          placeholder="Your last name"
                        />
                        {form.formState.errors.lastName && (
                          <p className="text-red-600 text-sm mt-1">{form.formState.errors.lastName.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          {...form.register("email")}
                          className="mt-1"
                          placeholder="your.email@example.com"
                        />
                        {form.formState.errors.email && (
                          <p className="text-red-600 text-sm mt-1">{form.formState.errors.email.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          {...form.register("phone")}
                          className="mt-1"
                          placeholder="+234 XXX XXX XXXX"
                        />
                        {form.formState.errors.phone && (
                          <p className="text-red-600 text-sm mt-1">{form.formState.errors.phone.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Alumni Information */}
                  <div className="pt-6 border-t">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Alumni Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="scvNo">SCV No *</Label>
                        <Input
                          id="scvNo"
                          {...form.register("scvNo")}
                          className="mt-1"
                          placeholder="e.g. SCV123456"
                        />
                        {form.formState.errors.scvNo && (
                          <p className="text-red-600 text-sm mt-1">{form.formState.errors.scvNo.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="squadron">Squadron *</Label>
                        <Select onValueChange={(value) => form.setValue("squadron", value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select your squadron" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Blue">Blue</SelectItem>
                            <SelectItem value="Green">Green</SelectItem>
                            <SelectItem value="Purple">Purple</SelectItem>
                            <SelectItem value="Yellow">Yellow</SelectItem>
                            <SelectItem value="Red">Red</SelectItem>
                          </SelectContent>
                        </Select>
                        {form.formState.errors.squadron && (
                          <p className="text-red-600 text-sm mt-1">{form.formState.errors.squadron.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <Label htmlFor="currentLocation">Current Location *</Label>
                      <Input
                        id="currentLocation"
                        {...form.register("currentLocation")}
                        className="mt-1"
                        placeholder="City, State/Country"
                      />
                      {form.formState.errors.currentLocation && (
                        <p className="text-red-600 text-sm mt-1">{form.formState.errors.currentLocation.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Optional Information */}
                  <div className="pt-6 border-t">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="emergencyContact">Emergency Contact (Optional)</Label>
                        <Input
                          id="emergencyContact"
                          {...form.register("emergencyContact")}
                          className="mt-1"
                          placeholder="Name and phone number"
                        />
                      </div>
                      

                    </div>
                  </div>

                  {/* Terms and Updates */}
                  <div className="pt-6 border-t space-y-4">

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="emailUpdates"
                        {...form.register("emailUpdates")}
                      />
                      <Label htmlFor="emailUpdates" className="text-sm">
                        Send me updates about ExJAM events and activities
                      </Label>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing Registration...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Register & Pay ₦{event.price.toLocaleString()}
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    Your payment is processed securely. Registration confirmation will be sent to your email.
                  </p>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}