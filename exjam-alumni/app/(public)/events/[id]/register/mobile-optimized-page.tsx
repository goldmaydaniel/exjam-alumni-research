"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MultiStepForm, useMultiStepForm } from "@/components/ui/multi-step-form";
import {
  PersonalInfoStep,
  AlumniInfoStep,
  AdditionalInfoStep,
  TermsConfirmationStep,
} from "@/components/forms/registration-steps";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Check,
  Loader2,
  CreditCard,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

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
    "Full event access & materials",
    "All meals & refreshments included",
    "Networking sessions & reunions",
    "Digital certificates & souvenirs",
    "Professional photography",
    "Squadron meetups",
  ],
};

export default function MobileOptimizedRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'form' | 'payment' | 'success'>('form');
  
  const eventId = params.id as string;
  const { formData, updateFormData } = useMultiStepForm();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Form steps configuration
  const steps = [
    {
      id: "personal",
      title: "Personal Info",
      description: "Tell us about yourself",
      component: PersonalInfoStep,
      validation: () => {
        return !!(formData.firstName && formData.lastName && formData.email && formData.phone);
      },
    },
    {
      id: "alumni",
      title: "Alumni Details",
      description: "Your AFMS information",
      component: AlumniInfoStep,
      validation: () => {
        return !!(formData.scvNo && formData.squadron && formData.currentLocation);
      },
    },
    {
      id: "additional",
      title: "Additional Info",
      description: "Optional details (can skip)",
      component: AdditionalInfoStep,
      validation: () => true, // Optional step
    },
    {
      id: "confirmation",
      title: "Confirmation",
      description: "Review and confirm",
      component: TermsConfirmationStep,
      validation: () => {
        return formData.termsAccepted === true;
      },
    },
  ];

  const handleFormComplete = async (data: any) => {
    setIsSubmitting(true);
    setPaymentStep('payment');

    try {
      console.log('Final registration data:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setPaymentStep('success');
      toast.success("Registration successful! Welcome to PG Conference 2025!");
      
    } catch (error: any) {
      toast.error("Registration failed. Please try again.");
      setPaymentStep('form');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success State
  if (paymentStep === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Card className="text-center p-8 shadow-xl">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Registration Confirmed!
              </h1>
              <p className="text-gray-600 mb-6">
                Your registration for PG Conference 2025 has been confirmed. 
                Check your email for your ticket and event details.
              </p>
              <div className="space-y-3">
                <Button onClick={() => router.push('/events')} className="w-full h-12">
                  View My Events
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/')}
                  className="w-full h-12"
                >
                  Back to Home
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Payment Processing State
  if (paymentStep === 'payment') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Card className="text-center p-8 shadow-xl">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Processing Payment
              </h1>
              <p className="text-gray-600 mb-6">
                Please wait while we process your payment of ₦{event.price.toLocaleString()}...
              </p>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Do not close this window</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Main Form
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href={`/events/${eventId}`}>
              <Button variant="ghost" size="sm" className="h-10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="hidden sm:inline">Secure Registration</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-6">
            
            {/* Event Summary - Collapsible on Mobile */}
            <div className="lg:col-span-2">
              <div className="sticky top-20 space-y-4">
                {/* Mobile: Compact Event Card */}
                <Card className="p-4 lg:p-6">
                  <div className="space-y-3">
                    <div>
                      <h1 className="text-lg lg:text-xl font-bold text-gray-900 leading-tight">
                        {event.title}
                      </h1>
                      <p className="text-gray-600 text-sm mt-1 lg:text-base lg:mt-2">
                        {event.shortDescription}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <div className="flex-1">
                          <div className="font-semibold">{formatDate(event.startDate)}</div>
                          <div className="text-gray-600 text-xs">
                            {formatTime(event.startDate)} - {formatTime(event.endDate)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-green-600" />
                        <div className="flex-1">
                          <div className="font-semibold text-sm">{event.venue}</div>
                          <div className="text-gray-600 text-xs">{event.address}</div>
                        </div>
                      </div>
                    </div>

                    {/* Mobile: Collapsible Features */}
                    <details className="group lg:hidden">
                      <summary className="cursor-pointer text-sm font-semibold text-blue-600 flex items-center justify-between py-2">
                        What's Included
                        <span className="group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <div className="grid grid-cols-1 gap-1 pt-2">
                        {event.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs">
                            <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </details>

                    {/* Desktop: Always Show Features */}
                    <div className="hidden lg:block pt-4 border-t">
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
                <Card className="p-4 lg:p-6">
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
            </div>

            {/* Registration Form */}
            <div className="lg:col-span-3">
              <div className="mb-6">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
                  Complete Your Registration
                </h2>
                <p className="text-gray-600 mt-1">
                  Quick and secure - optimized for mobile!
                </p>
              </div>

              <MultiStepForm
                steps={steps}
                onComplete={handleFormComplete}
                formData={formData}
                onFormDataChange={updateFormData}
                showProgress={true}
                allowSkip={false}
                className="mb-8"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}