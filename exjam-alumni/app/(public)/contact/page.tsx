"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle,
  ChevronRight,
  Clock,
  Loader2,
  Mail,
  MapPin,
  Send,
  AlertCircle,
} from "lucide-react";

// Types
interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

// Constants
const INITIAL_FORM_DATA: FormData = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

const FAQ_DATA = [
  {
    question: "How do I join The EXJAM Association?",
    answer:
      "All Air Force Military School Jos graduates are automatically members of The EXJAM Association. Register online to update your details.",
  },
  {
    question: "What are the benefits of active membership?",
    answer:
      "Reconnect with fellow Ex-Junior Airmen, attend squadron reunions, access career networks, and mentorship programs.",
  },
  {
    question: "How can I update my contact information?",
    answer:
      "Log into your dashboard and update your profile, or contact the alumni office directly.",
  },
  {
    question: "Can I volunteer for The EXJAM Association activities?",
    answer:
      "Yes! Ex-Junior Airmen regularly volunteer for reunions, mentorship programs, and AFMS support initiatives.",
  },
];

const CONTACT_OPTIONS = [
  {
    icon: Mail,
    title: "Email Us",
    description: "For general inquiries",
    content: "Send us your questions, suggestions, or feedback anytime.",
    action: "info@exjam.org.ng",
    href: "mailto:info@exjam.org.ng",
    color: "blue",
  },
  {
    icon: MapPin,
    title: "Visit Us",
    description: "Alumni headquarters",
    content: {
      office: "The EXJAM Association Alumni Office",
      city: "Jos, Plateau State",
      country: "Nigeria",
    },
    action: "Get Directions",
    color: "purple",
  },
];

// Validation function
const validateForm = (data: FormData): FormErrors => {
  const errors: FormErrors = {};

  if (!data.name.trim()) {
    errors.name = "Name is required";
  } else if (data.name.length < 2) {
    errors.name = "Name must be at least 2 characters";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email.trim()) {
    errors.email = "Email is required";
  } else if (!emailRegex.test(data.email)) {
    errors.email = "Please enter a valid email address";
  }

  if (!data.subject.trim()) {
    errors.subject = "Subject is required";
  } else if (data.subject.length < 3) {
    errors.subject = "Subject must be at least 3 characters";
  }

  if (!data.message.trim()) {
    errors.message = "Message is required";
  } else if (data.message.length < 10) {
    errors.message = "Message must be at least 10 characters";
  }

  return errors;
};

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState("");

  // Memoized validation check
  const isFormValid = useMemo(() => {
    return (
      formData.name.trim() !== "" &&
      formData.email.trim() !== "" &&
      formData.subject.trim() !== "" &&
      formData.message.trim() !== "" &&
      Object.keys(errors).length === 0
    );
  }, [formData, errors]);

  // Handle input change with validation
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;

      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      // Clear error for this field if it exists
      if (errors[name as keyof FormErrors]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name as keyof FormErrors];
          return newErrors;
        });
      }
    },
    [errors]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate form
      const validationErrors = validateForm(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      setIsSubmitting(true);
      setSubmitStatus("idle");

      try {
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        setSubmitStatus("success");
        setSubmitMessage("Thank you for your message! We'll get back to you within 24 hours.");
        setFormData(INITIAL_FORM_DATA);

        // Clear success message after 5 seconds
        setTimeout(() => {
          setSubmitStatus("idle");
          setSubmitMessage("");
        }, 5000);
      } catch (error) {
        setSubmitStatus("error");
        setSubmitMessage("Sorry, something went wrong. Please try again or email us directly.");
        console.error("Contact form error:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData]
  );

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 py-24">
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E")`,
            }}
            aria-hidden="true"
          />
        </div>

        <div className="container relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-4xl font-black tracking-tight text-white md:text-6xl">
              Contact the
              <span className="block bg-gradient-to-r from-yellow-400 via-green-400 to-blue-400 bg-clip-text text-transparent">
                Secretariat
              </span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-xl font-light text-blue-100">
              Questions about The EXJAM Association membership, reunions, or want to reconnect with
              fellow Ex-Junior Airmen? We're here to help.
            </p>
            <div className="flex flex-col items-center justify-center gap-6 text-white/90 sm:flex-row">
              <a
                href="mailto:info@exjam.org.ng"
                className="flex items-center gap-2 transition-colors hover:text-yellow-400"
                aria-label="Email us at info@exjam.org.ng"
              >
                <Mail className="h-5 w-5" />
                info@exjam.org.ng
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Options Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-20 dark:from-gray-900 dark:to-background">
        <div className="container">
          <div className="mb-16 text-center">
            <span className="text-sm font-bold uppercase tracking-wider text-blue-600">
              Multiple Ways to Connect
            </span>
            <h2 className="mt-4 text-4xl font-black text-gray-900 dark:text-white md:text-5xl">
              Choose How to Reach Us
            </h2>
          </div>

          <div className="mx-auto max-w-4xl">
            <div className="grid gap-8 md:grid-cols-2">
              {CONTACT_OPTIONS.map((option, index) => (
                <Card
                  key={index}
                  className={`group border-t-4 border-${option.color}-500 transition-all duration-300 hover:shadow-2xl`}
                >
                  <CardHeader>
                    <div
                      className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-${option.color}-500 to-${option.color === "blue" ? "indigo" : "pink"}-600`}
                    >
                      <option.icon className="h-7 w-7 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold">{option.title}</CardTitle>
                    <CardDescription>{option.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {typeof option.content === "string" ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{option.content}</p>
                    ) : (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p className="font-medium">{option.content.office}</p>
                        <p>{option.content.city}</p>
                        <p>{option.content.country}</p>
                      </div>
                    )}
                    {option.href ? (
                      <a
                        href={option.href}
                        className={`inline-flex items-center gap-2 font-semibold text-${option.color}-600 hover:text-${option.color}-700`}
                      >
                        {option.action}
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    ) : (
                      <button
                        className={`inline-flex items-center gap-2 font-semibold text-${option.color}-600 hover:text-${option.color}-700`}
                      >
                        {option.action}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact-form" className="bg-white py-20 dark:bg-background">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="mb-12 text-center">
              <span className="text-sm font-bold uppercase tracking-wider text-blue-600">
                Send a Message
              </span>
              <h2 className="mt-4 text-4xl font-black text-gray-900 dark:text-white md:text-5xl">
                We'd Love to Hear From You
              </h2>
              <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
                Fill out the form below and we'll get back to you within 24 hours
              </p>
            </div>

            {/* Status Messages */}
            {submitStatus === "success" && (
              <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700 dark:text-green-300">
                  {submitMessage}
                </AlertDescription>
              </Alert>
            )}

            {submitStatus === "error" && (
              <Alert className="mb-6 border-red-500 bg-red-50 dark:bg-red-950">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700 dark:text-red-300">
                  {submitMessage}
                </AlertDescription>
              </Alert>
            )}

            <Card className="border-0 shadow-xl">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-semibold">
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your Full Name"
                        required
                        className={`h-12 ${errors.name ? "border-red-500" : ""}`}
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? "name-error" : undefined}
                      />
                      {errors.name && (
                        <p id="name-error" className="text-sm text-red-500">
                          {errors.name}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your.email@domain.com"
                        required
                        className={`h-12 ${errors.email ? "border-red-500" : ""}`}
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? "email-error" : undefined}
                      />
                      {errors.email && (
                        <p id="email-error" className="text-sm text-red-500">
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-sm font-semibold">
                      Subject *
                    </Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="What is this about?"
                      required
                      className={`h-12 ${errors.subject ? "border-red-500" : ""}`}
                      aria-invalid={!!errors.subject}
                      aria-describedby={errors.subject ? "subject-error" : undefined}
                    />
                    {errors.subject && (
                      <p id="subject-error" className="text-sm text-red-500">
                        {errors.subject}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm font-semibold">
                      Message *
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us more about your inquiry..."
                      required
                      rows={6}
                      className={`resize-none ${errors.message ? "border-red-500" : ""}`}
                      aria-invalid={!!errors.message}
                      aria-describedby={errors.message ? "message-error" : undefined}
                    />
                    {errors.message && (
                      <p id="message-error" className="text-sm text-red-500">
                        {errors.message}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-center pt-4">
                    <Button
                      type="submit"
                      size="lg"
                      disabled={isSubmitting || !isFormValid}
                      className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-10 py-6 text-lg font-bold text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-5 w-5" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-20 dark:from-gray-900 dark:to-background">
        <div className="container">
          <div className="mb-16 text-center">
            <span className="text-sm font-bold uppercase tracking-wider text-blue-600">
              Frequently Asked
            </span>
            <h2 className="mt-4 text-4xl font-black text-gray-900 dark:text-white md:text-5xl">
              Common Questions
            </h2>
          </div>

          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
            {FAQ_DATA.map((faq, index) => (
              <Card key={index} className="border-l-4 border-blue-500">
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Didn't find what you're looking for?
            </p>
            <Button variant="outline" className="font-semibold">
              <Link href="#contact-form" className="flex items-center gap-2">
                Ask a Question
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid2' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='white' stroke-width='0.5' opacity='0.1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid2)'/%3E%3C/svg%3E")`,
          }}
          aria-hidden="true"
        />

        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center text-white">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 backdrop-blur-sm">
              <Clock className="h-5 w-5 text-yellow-400" />
              <span className="font-semibold">Office Hours: Mon-Fri, 9AM-5PM</span>
            </div>

            <h2 className="mb-6 text-3xl font-black md:text-5xl">Stay Connected</h2>
            <p className="mb-10 text-xl text-blue-100">
              Follow us on social media for the latest news and updates from the Ex-Junior Airmen
              community.
            </p>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="transform rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 px-8 py-6 text-lg font-bold text-black shadow-2xl transition-all hover:scale-105 hover:from-yellow-600 hover:to-orange-600"
              >
                <Link href="/register" className="flex items-center gap-2">
                  Join The EXJAM Association
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-2 border-white/30 bg-white/10 px-8 py-6 text-lg font-semibold text-white backdrop-blur-sm hover:bg-white/20"
              >
                <Link href="/events" className="flex items-center gap-2">
                  View Events
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
