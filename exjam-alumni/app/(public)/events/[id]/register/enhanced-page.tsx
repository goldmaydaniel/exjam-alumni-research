"use client";

import { useState, useEffect } from "react";
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
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Shield,
  Loader2,
  CreditCard,
  Check,
  AlertCircle,
  Clock,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { getClientUser } from "@/lib/auth/unified-auth";

// Enhanced registration schema
const registrationSchema = z.object({
  // Personal Info
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"), 
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Phone number is required"),
  
  // Alumni Info
  graduationYear: z.string().min(4, "Graduation year is required"),
  squadron: z.string().min(2, "Squadron is required"),
  serviceNumber: z.string().optional(),
  chapter: z.string().min(2, "Chapter is required"),
  currentLocation: z.string().min(2, "Current location is required"),
  
  // Event specifics
  ticketType: z.enum(["REGULAR", "VIP", "STUDENT"]).default("REGULAR"),
  arrivalDate: z.string().optional(),
  departureDate: z.string().optional(),
  expectations: z.string().max(500).optional(),
  emergencyContact: z.string().optional(),
  specialRequests: z.string().max(500).optional(),
  
  // Terms
  termsAccepted: z.boolean().refine(val => val === true, "You must accept terms"),
  emailUpdates: z.boolean().default(true),
});

type RegistrationForm = z.infer<typeof registrationSchema>;

interface Event {
  id: string;
  title: string;
  shortDescription: string;
  startDate: string;
  endDate: string;
  venue: string;
  address: string;
  price: number;
  capacity: number;
  currentRegistrations: number;
  availableSpots: number;
  features: string[];
  imageUrl?: string;
}

interface CapacityInfo {
  hasCapacity: boolean;
  currentRegistrations: number;
  capacity: number;
  waitlistCount: number;
  availableSpots: number;
}

export default function EnhancedRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'payment' | 'success' | 'waitlist'>('form');
  const [event, setEvent] = useState<Event | null>(null);
  const [capacityInfo, setCapacityInfo] = useState<CapacityInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [registrationResult, setRegistrationResult] = useState<any>(null);

  const eventId = params.id as string;

  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      ticketType: "REGULAR",
      emailUpdates: true,
      termsAccepted: false,
    }
  });

  // Load event and capacity info
  useEffect(() => {
    const loadEventData = async () => {
      try {
        setLoading(true);
        
        // Load user data
        const userData = await getClientUser();
        setUser(userData);

        // Pre-fill form with user data
        if (userData) {
          form.setValue('firstName', userData.firstName || '');
          form.setValue('lastName', userData.lastName || '');
          form.setValue('email', userData.email || '');
          form.setValue('graduationYear', userData.graduationYear || '');
          form.setValue('squadron', userData.squadron || '');
          form.setValue('serviceNumber', userData.serviceNumber || '');
          form.setValue('currentLocation', userData.currentLocation || '');
          form.setValue('chapter', userData.chapter || '');
        }

        // Load event data
        const [eventResponse, capacityResponse] = await Promise.all([
          fetch(`/api/events/${eventId}`),
          fetch(`/api/events/${eventId}/capacity`)
        ]);

        if (eventResponse.ok) {
          const eventData = await eventResponse.json();
          setEvent(eventData);
        }

        if (capacityResponse.ok) {
          const capacityData = await capacityResponse.json();
          setCapacityInfo(capacityData);
        }
      } catch (error) {
        console.error('Failed to load event data:', error);
        toast.error('Failed to load event information');
      } finally {
        setLoading(false);
      }
    };

    loadEventData();
    
    // Set up real-time capacity updates
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/capacity`);
        if (response.ok) {
          const data = await response.json();
          setCapacityInfo(data);
        }
      } catch (error) {
        console.error('Failed to update capacity:', error);
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [eventId, form]);

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
      const registrationData = {
        eventId,
        ticketType: data.ticketType,
        arrivalDate: data.arrivalDate ? new Date(data.arrivalDate).toISOString() : undefined,
        departureDate: data.departureDate ? new Date(data.departureDate).toISOString() : undefined,
        expectations: data.expectations,
        specialRequests: data.specialRequests,
      };

      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.code === 'ALREADY_REGISTERED') {
          toast.error(result.error);
          router.push('/dashboard/registrations');
          return;
        }
        throw new Error(result.error || 'Registration failed');
      }

      setRegistrationResult(result);

      if (result.waitlisted) {
        setStep('waitlist');
        toast.success(`Added to waitlist at position ${result.position}!`);
      } else if (result.paymentRequired) {
        setStep('payment');
        toast.success('Registration created! Processing payment...');
        
        // Simulate payment processing
        setTimeout(() => {
          setStep('success');
          toast.success('Registration successful!');
        }, 2000);
      } else {
        setStep('success');
        toast.success('Registration successful!');
      }
      
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading event information...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <p className="text-gray-600 mb-6">The event you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push('/events')}>
            View All Events
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Registration Confirmed!</h1>
          <p className="text-gray-600 mb-6">
            Your registration for {event.title} has been confirmed. 
            Check your email for your ticket and event details.
          </p>
          <div className="space-y-3">
            <Button onClick={() => router.push('/dashboard/registrations')} className="w-full">
              View My Registrations
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/events')}
              className="w-full"
            >
              Browse More Events
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (step === 'waitlist') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Added to Waitlist</h1>
          <p className="text-gray-600 mb-6">
            The event is currently full, but you've been added to the waitlist at position{' '}
            <strong>#{registrationResult?.position}</strong>. We'll notify you if a spot becomes available.
          </p>
          <div className="space-y-3">
            <Button onClick={() => router.push('/dashboard/registrations')} className="w-full">
              View My Registrations
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/events')}
              className="w-full"
            >
              Browse Other Events
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

  const capacityPercentage = capacityInfo 
    ? Math.min((capacityInfo.currentRegistrations / capacityInfo.capacity) * 100, 100)
    : 0;

  const isNearCapacity = capacityPercentage > 80;
  const isFullCapacity = capacityPercentage >= 100;

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

                    {capacityInfo && (
                      <div className="flex items-center gap-3 text-sm">
                        <Users className="w-4 h-4 text-purple-600" />
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="font-semibold">
                              {isFullCapacity ? 'Event Full' : `${capacityInfo.availableSpots} spots left`}
                            </span>
                            <span className="text-gray-600">
                              {capacityInfo.currentRegistrations}/{capacityInfo.capacity}
                            </span>
                          </div>
                          <Progress value={capacityPercentage} className="h-2" />
                          {capacityInfo.waitlistCount > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              {capacityInfo.waitlistCount} people on waitlist
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {isNearCapacity && !isFullCapacity && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-800">
                          Almost Full - Register Soon!
                        </span>
                      </div>
                    </div>
                  )}

                  {isFullCapacity && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">
                          Joining Waitlist - You'll be notified if spots open up
                        </span>
                      </div>
                    </div>
                  )}

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
                <h3 className="font-semibold text-gray-900 mb-4">Registration Fee</h3>
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
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isFullCapacity ? 'Join Waitlist' : 'Complete Your Registration'}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {isFullCapacity 
                      ? "We'll notify you if a spot becomes available"
                      : "Secure your spot now!"
                    }
                  </p>
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
                        <Label htmlFor="graduationYear">Graduation Year *</Label>
                        <Input
                          id="graduationYear"
                          {...form.register("graduationYear")}
                          className="mt-1"
                          placeholder="e.g. 1995"
                        />
                        {form.formState.errors.graduationYear && (
                          <p className="text-red-600 text-sm mt-1">{form.formState.errors.graduationYear.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="squadron">Squadron *</Label>
                        <Select onValueChange={(value) => form.setValue("squadron", value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select your squadron" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GREEN">Green Squadron</SelectItem>
                            <SelectItem value="RED">Red Squadron</SelectItem>
                            <SelectItem value="PURPLE">Purple Squadron</SelectItem>
                            <SelectItem value="YELLOW">Yellow Squadron</SelectItem>
                            <SelectItem value="DORNIER">Dornier Squadron</SelectItem>
                            <SelectItem value="PUMA">Puma Squadron</SelectItem>
                          </SelectContent>
                        </Select>
                        {form.formState.errors.squadron && (
                          <p className="text-red-600 text-sm mt-1">{form.formState.errors.squadron.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      <div>
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

                      <div>
                        <Label htmlFor="chapter">Chapter *</Label>
                        <Input
                          id="chapter"
                          {...form.register("chapter")}
                          className="mt-1"
                          placeholder="Your chapter"
                        />
                        {form.formState.errors.chapter && (
                          <p className="text-red-600 text-sm mt-1">{form.formState.errors.chapter.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="pt-6 border-t">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="ticketType">Ticket Type</Label>
                        <Select onValueChange={(value) => form.setValue("ticketType", value as any)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select ticket type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="REGULAR">Regular - ₦{event.price.toLocaleString()}</SelectItem>
                            <SelectItem value="VIP">VIP - ₦{(event.price * 1.5).toLocaleString()}</SelectItem>
                            <SelectItem value="STUDENT">Student - ₦{(event.price * 0.7).toLocaleString()}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="arrivalDate">Expected Arrival Date</Label>
                          <Input
                            id="arrivalDate"
                            type="date"
                            {...form.register("arrivalDate")}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="departureDate">Expected Departure Date</Label>
                          <Input
                            id="departureDate"
                            type="date"
                            {...form.register("departureDate")}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="expectations">What are your expectations? (Optional)</Label>
                        <Textarea
                          id="expectations"
                          {...form.register("expectations")}
                          className="mt-1"
                          placeholder="Tell us what you hope to get from this event..."
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="specialRequests">Special Requirements (Optional)</Label>
                        <Textarea
                          id="specialRequests"
                          {...form.register("specialRequests")}
                          className="mt-1"
                          placeholder="Any dietary restrictions, accessibility needs, etc..."
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Terms and Updates */}
                  <div className="pt-6 border-t space-y-4">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="termsAccepted"
                        {...form.register("termsAccepted")}
                      />
                      <Label htmlFor="termsAccepted" className="text-sm">
                        I accept the terms and conditions and privacy policy *
                      </Label>
                    </div>
                    {form.formState.errors.termsAccepted && (
                      <p className="text-red-600 text-sm">{form.formState.errors.termsAccepted.message}</p>
                    )}

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
                    className={`w-full h-12 text-lg font-semibold ${
                      isFullCapacity
                        ? "bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {isFullCapacity ? "Joining Waitlist..." : "Processing Registration..."}
                      </>
                    ) : (
                      <>
                        {isFullCapacity ? (
                          <>
                            <UserCheck className="w-5 h-5 mr-2" />
                            Join Waitlist (Free)
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-5 h-5 mr-2" />
                            Register & Pay ₦{event.price.toLocaleString()}
                          </>
                        )}
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    {isFullCapacity 
                      ? "You'll be notified by email if a spot becomes available"
                      : "Your payment is processed securely. Registration confirmation will be sent to your email."
                    }
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