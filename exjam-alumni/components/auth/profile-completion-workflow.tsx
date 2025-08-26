"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MilitaryServiceForm } from "./military-service-form";
import {
  calculateMilitaryProfileCompleteness,
  type MilitaryServiceData,
} from "@/lib/military-verification";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  User,
  FileText,
  ArrowRight,
  X,
} from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  serviceNumber?: string;
  squadron?: string;
  rank?: string;
  serviceYearFrom?: number;
  serviceYearTo?: number | null;
  specialization?: string;
  baseLocation?: string;
  isVerified?: boolean;
  verificationStatus?: "pending" | "approved" | "rejected" | "incomplete";
  createdAt: Date;
}

interface ProfileCompletionWorkflowProps {
  user: UserProfile;
  onProfileUpdate: (data: MilitaryServiceData) => Promise<void>;
  onDismiss?: () => void;
  className?: string;
}

export const ProfileCompletionWorkflow: React.FC<ProfileCompletionWorkflowProps> = ({
  user,
  onProfileUpdate,
  onDismiss,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReminder, setShowReminder] = useState(false);

  // Calculate profile completeness
  const { score, missingFields } = calculateMilitaryProfileCompleteness({
    serviceNumber: user.serviceNumber,
    squadron: user.squadron,
    rank: user.rank,
    serviceYearFrom: user.serviceYearFrom,
    serviceYearTo: user.serviceYearTo,
    specialization: user.specialization,
    baseLocation: user.baseLocation,
  });

  // Determine if profile needs completion
  const needsCompletion = score < 100 || missingFields.length > 0;
  const isIncomplete = score < 80; // Missing required fields

  // Calculate days since registration
  const daysSinceRegistration = Math.floor(
    (new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 3600 * 24)
  );

  // Show reminder logic
  useEffect(() => {
    if (needsCompletion && daysSinceRegistration >= 1 && !isOpen) {
      setShowReminder(true);
    }
  }, [needsCompletion, daysSinceRegistration, isOpen]);

  const handleSubmit = async (data: MilitaryServiceData) => {
    setIsSubmitting(true);
    try {
      await onProfileUpdate(data);
      setIsOpen(false);
      setShowReminder(false);
    } catch (error) {
      console.error("Profile update error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = () => {
    if (score >= 100) return "text-green-600";
    if (score >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  const getStatusIcon = () => {
    if (score >= 100) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (score >= 80) return <Clock className="h-4 w-4 text-yellow-600" />;
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  const getStatusText = () => {
    if (score >= 100) return "Complete";
    if (score >= 80) return "Nearly Complete";
    return "Incomplete";
  };

  const getUrgencyLevel = () => {
    if (isIncomplete && daysSinceRegistration >= 7) return "high";
    if (needsCompletion && daysSinceRegistration >= 3) return "medium";
    return "low";
  };

  // Don't show anything if profile is complete and verified
  if (score >= 100 && user.isVerified) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Profile Completion Status Card */}
      <Card
        className={cn(
          "border-l-4",
          score >= 100
            ? "border-l-green-500"
            : score >= 80
              ? "border-l-yellow-500"
              : "border-l-red-500"
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5" />
              Military Profile Status
              {getStatusIcon()}
            </CardTitle>
            <Badge variant={score >= 80 ? "default" : "destructive"} className={getStatusColor()}>
              {getStatusText()} ({score}%)
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Profile Completion</span>
              <span className={getStatusColor()}>{score}%</span>
            </div>
            <Progress value={score} className="h-2" />
          </div>

          {missingFields.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Missing Required Information:</p>
              <div className="flex flex-wrap gap-2">
                {missingFields.map((field) => (
                  <Badge key={field} variant="outline" className="text-xs">
                    {field}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button
                  variant={isIncomplete ? "default" : "outline"}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  {isIncomplete ? "Complete Profile" : "Update Information"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </DialogTrigger>

              <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Complete Your Military Service Profile</DialogTitle>
                </DialogHeader>

                <MilitaryServiceForm
                  onSubmit={handleSubmit}
                  initialData={{
                    serviceNumber: user.serviceNumber,
                    squadron: user.squadron,
                    rank: user.rank,
                    serviceYearFrom: user.serviceYearFrom,
                    serviceYearTo: user.serviceYearTo,
                    specialization: user.specialization,
                    baseLocation: user.baseLocation,
                  }}
                  isLoading={isSubmitting}
                  showTitle={false}
                  userId={user.id}
                />
              </DialogContent>
            </Dialog>

            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="flex items-center gap-2"
              >
                Dismiss
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Urgent Reminder Alert */}
      {showReminder && getUrgencyLevel() === "high" && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Action Required</AlertTitle>
          <AlertDescription className="text-red-700">
            Your military service information is incomplete. This is required for full EXJAM
            membership access. You registered {daysSinceRegistration} days ago - please complete
            your profile now.
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                onClick={() => setIsOpen(true)}
                className="bg-red-600 hover:bg-red-700"
              >
                Complete Now
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowReminder(false)}
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Medium Priority Reminder */}
      {showReminder && getUrgencyLevel() === "medium" && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Profile Incomplete</AlertTitle>
          <AlertDescription className="text-yellow-700">
            Please complete your military service information to access all EXJAM features.
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                onClick={() => setIsOpen(true)}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                Complete Profile
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowReminder(false)}
                className="border-yellow-200 text-yellow-700 hover:bg-yellow-50"
              >
                Later
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Verification Status */}
      {user.verificationStatus && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-2">
                {user.verificationStatus === "approved" && (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-600">Verified</span>
                  </>
                )}
                {user.verificationStatus === "pending" && (
                  <>
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-600">Pending Verification</span>
                  </>
                )}
                {user.verificationStatus === "rejected" && (
                  <>
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="font-medium text-red-600">Verification Required</span>
                  </>
                )}
                {user.verificationStatus === "incomplete" && (
                  <>
                    <AlertTriangle className="h-4 w-4 text-gray-600" />
                    <span className="font-medium text-gray-600">Incomplete</span>
                  </>
                )}
              </div>
              <span className="text-muted-foreground">
                Your military service information is being reviewed by EXJAM administrators.
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Quick completion banner for dashboard
export const ProfileCompletionBanner: React.FC<{
  user: UserProfile;
  onComplete: () => void;
  onDismiss: () => void;
}> = ({ user, onComplete, onDismiss }) => {
  const { score, missingFields } = calculateMilitaryProfileCompleteness(user);

  if (score >= 80) return null; // Don't show banner if mostly complete

  return (
    <Alert className="mb-6 border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800">Complete Your Profile</AlertTitle>
      <AlertDescription className="text-amber-700">
        Your military service information is incomplete ({score}% complete). Missing:{" "}
        {missingFields.join(", ")}.
        <div className="mt-2 flex gap-2">
          <Button size="sm" onClick={onComplete} className="bg-amber-600 hover:bg-amber-700">
            Complete Now
          </Button>
          <Button size="sm" variant="outline" onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default ProfileCompletionWorkflow;
