"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  Star,
  Shield,
  Calendar,
  MapPin,
  QrCode,
  User,
  Mail,
  Phone,
  Award,
  Sparkles,
  CheckCircle,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/store/consolidated-auth";
import html2canvas from "html2canvas";

interface BadgeData {
  user: {
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phone?: string;
    serviceNumber?: string;
    squadron?: string;
    profilePhoto?: string;
  };
  registration: {
    id: string;
    ticketType: string;
    registeredAt: string;
    status: string;
  };
  event: {
    title: string;
    startDate: string;
    endDate: string;
    venue: string;
  };
  ticket: {
    ticketNumber: string;
    qrCode: string;
    status: string;
    isTemporary?: boolean;
  };
  payment: {
    status: string;
    verifiedAt?: string;
  };
}

export default function BadgePage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const [badgeData, setBadgeData] = useState<BadgeData | null>(null);
  const [loading, setLoading] = useState(true);
  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (params?.registrationId) {
      fetchBadgeData(params.registrationId as string);
    }
  }, [params?.registrationId]);

  const fetchBadgeData = async (registrationId: string) => {
    try {
      const response = await fetch(`/api/badge/${registrationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setBadgeData(data);
      } else {
        toast.error("Badge not found");
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Failed to fetch badge:", error);
      toast.error("Failed to load badge");
    } finally {
      setLoading(false);
    }
  };

  const downloadBadge = async () => {
    if (!badgeRef.current) return;

    try {
      toast.loading("Generating badge image...");

      const canvas = await html2canvas(badgeRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        allowTaint: false,
        height: badgeRef.current.scrollHeight,
        width: badgeRef.current.scrollWidth,
      });

      const dataURL = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataURL;
      link.download = `PGCON25-Badge-${badgeData?.user.firstName}-${badgeData?.user.lastName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.dismiss();
      toast.success("Badge downloaded successfully!");
    } catch (error) {
      toast.dismiss();
      console.error("Download error:", error);
      toast.error("Failed to download badge");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!badgeData) {
    return (
      <div className="container py-8 text-center">
        <h1 className="mb-4 text-2xl font-bold">Badge not found</h1>
        <Button onClick={() => router.push("/dashboard")}>Return to Dashboard</Button>
      </div>
    );
  }

  const isTemporary = badgeData.ticket.isTemporary;
  const isVerified = badgeData.payment.status === "COMPLETED";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Event Badge</h1>
          <p className="text-muted-foreground">
            {isTemporary
              ? "Temporary Badge - Awaiting Payment Verification"
              : "Official Event Badge"}
          </p>
        </div>

        {/* Badge Card */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div
              ref={badgeRef}
              className="relative bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white"
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div
                  className="h-full w-full"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='badge-grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='white' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23badge-grid)'/%3E%3C/svg%3E")`,
                  }}
                />
              </div>

              {/* Status Banner */}
              {isTemporary && (
                <div className="absolute right-0 top-0 z-10 -translate-y-2 translate-x-4 rotate-12 transform bg-yellow-500 px-4 py-2 text-sm font-bold text-black">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    TEMPORARY
                  </div>
                </div>
              )}

              {isVerified && !isTemporary && (
                <div className="absolute right-4 top-4 z-10">
                  <div className="rounded-full bg-green-500 p-2">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
              )}

              <div className="relative z-10 space-y-6 p-8">
                {/* Event Header */}
                <div className="space-y-2 text-center">
                  <div className="flex items-center justify-center space-x-2 text-yellow-300">
                    <Star className="h-5 w-5 fill-current" />
                    <span className="text-sm font-semibold tracking-wider">
                      THE EXJAM ASSOCIATION
                    </span>
                    <Star className="h-5 w-5 fill-current" />
                  </div>
                  <h1 className="text-2xl font-bold">{badgeData.event.title}</h1>
                  <div className="flex items-center justify-center space-x-4 text-sm opacity-90">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(badgeData.event.startDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{badgeData.event.venue}</span>
                    </div>
                  </div>
                </div>

                <Separator className="bg-white/20" />

                {/* User Info */}
                <div className="flex items-center space-x-6">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/30 bg-gradient-to-br from-yellow-400 to-orange-500 text-3xl font-bold">
                      {badgeData.user.profilePhoto ? (
                        <img
                          src={badgeData.user.profilePhoto}
                          alt="Profile"
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <span>
                          {badgeData.user.firstName[0]}
                          {badgeData.user.lastName[0]}
                        </span>
                      )}
                    </div>
                    {badgeData.registration.ticketType === "VIP" && (
                      <div className="absolute -right-1 -top-1 rounded-full bg-yellow-400 p-1">
                        <Award className="h-4 w-4 text-black" />
                      </div>
                    )}
                  </div>

                  {/* User Details */}
                  <div className="flex-1 space-y-2">
                    <h2 className="text-2xl font-bold">
                      {badgeData.user.firstName} {badgeData.user.lastName}
                    </h2>
                    <div className="space-y-1 text-sm opacity-90">
                      {badgeData.user.serviceNumber && (
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4" />
                          <span>Service #{badgeData.user.serviceNumber}</span>
                        </div>
                      )}
                      {badgeData.user.squadron && (
                        <div className="flex items-center space-x-2">
                          <Award className="h-4 w-4" />
                          <span>{badgeData.user.squadron} Squadron</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>{badgeData.user.email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="bg-white/20" />

                {/* Registration Details */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm opacity-75">Registration Type</p>
                    <Badge
                      variant="secondary"
                      className={`px-3 py-1 text-sm font-bold ${
                        badgeData.registration.ticketType === "VIP"
                          ? "bg-yellow-400 text-black"
                          : badgeData.registration.ticketType === "STUDENT"
                            ? "bg-green-400 text-black"
                            : "bg-blue-400 text-black"
                      } `}
                    >
                      {badgeData.registration.ticketType}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-right">
                    <p className="text-sm opacity-75">Ticket Number</p>
                    <code className="rounded bg-black/20 px-3 py-1 font-mono text-sm">
                      {badgeData.ticket.ticketNumber}
                    </code>
                  </div>
                </div>

                {/* QR Code */}
                <div className="space-y-2 text-center">
                  <div className="inline-block rounded-lg bg-white p-4">
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded bg-gray-200">
                      <QrCode className="h-12 w-12 text-gray-600" />
                    </div>
                  </div>
                  <p className="text-xs opacity-75">
                    {isTemporary ? "Temporary QR Code" : "Scan for event check-in"}
                  </p>
                </div>

                {/* Footer */}
                <div className="border-t border-white/20 pt-4 text-center">
                  <div className="flex items-center justify-center space-x-2 text-xs opacity-75">
                    <Sparkles className="h-4 w-4" />
                    <span>AFMS Jos Alumni • Strive to Excel</span>
                    <Sparkles className="h-4 w-4" />
                  </div>
                  {isVerified && badgeData.payment.verifiedAt && (
                    <p className="mt-1 text-xs opacity-60">
                      Verified: {new Date(badgeData.payment.verifiedAt).toLocaleDateString()}
                    </p>
                  )}
                  {isTemporary && (
                    <p className="mt-1 text-xs text-yellow-200">
                      This is a temporary badge. Official badge will be issued after payment
                      verification.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-center gap-3">
          <Button onClick={downloadBadge} size="lg">
            <Download className="mr-2 h-4 w-4" />
            Download Badge
          </Button>
          <Button onClick={() => router.push("/dashboard")} variant="outline" size="lg">
            Return to Dashboard
          </Button>
          {isTemporary && (
            <Button
              onClick={() => router.push(`/payment/${badgeData.registration.id}`)}
              variant="secondary"
              size="lg"
            >
              <User className="mr-2 h-4 w-4" />
              Complete Payment
            </Button>
          )}
        </div>

        {/* Status Info */}
        {isTemporary && (
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/10">
            <CardContent className="pt-6">
              <div className="space-y-2 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-yellow-700 dark:text-yellow-400">
                  Awaiting Payment Verification
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your official badge will be generated once your bank transfer is verified by our
                  team. This usually takes 1-2 business days.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
