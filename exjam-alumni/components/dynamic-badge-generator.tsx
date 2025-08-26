"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Download, Share2, Copy, Check, Medal, User, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { STORAGE_BUCKETS, getStorageUrl } from "@/lib/supabase/storage";
import html2canvas from "html2canvas";
import { useSiteConfig } from "@/hooks/useSiteConfig";

interface BadgeData {
  id: string;
  userId: string;
  eventId?: string;
  type: "registration" | "attendance" | "achievement" | "speaker" | "organizer";
  title: string;
  subtitle?: string;
  description?: string;
  dateIssued: Date;
  eventName?: string;
  eventDate?: Date;
  eventLocation?: string;
  photoUrl?: string;
  badgePhotoUrl?: string;
  qrCodeUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
}

interface DynamicBadgeProps {
  badge: BadgeData;
  size?: "sm" | "md" | "lg";
  showDownload?: boolean;
  showShare?: boolean;
  className?: string;
}

const badgeTypeConfig = {
  registration: {
    color: "bg-blue-500",
    icon: User,
    label: "Registration Badge",
  },
  attendance: {
    color: "bg-green-500",
    icon: Check,
    label: "Attendance Badge",
  },
  achievement: {
    color: "bg-purple-500",
    icon: Medal,
    label: "Achievement Badge",
  },
  speaker: {
    color: "bg-orange-500",
    icon: Medal,
    label: "Speaker Badge",
  },
  organizer: {
    color: "bg-red-500",
    icon: Medal,
    label: "Organizer Badge",
  },
};

const sizeConfig = {
  sm: {
    container: "w-64 h-80",
    photo: "w-16 h-16",
    title: "text-sm",
    subtitle: "text-xs",
    badge: "text-xs px-2 py-1",
  },
  md: {
    container: "w-80 h-96",
    photo: "w-20 h-20",
    title: "text-lg",
    subtitle: "text-sm",
    badge: "text-sm px-3 py-1",
  },
  lg: {
    container: "w-96 h-120",
    photo: "w-24 h-24",
    title: "text-xl",
    subtitle: "text-base",
    badge: "text-base px-4 py-2",
  },
};

export function DynamicBadge({
  badge,
  size = "md",
  showDownload = false,
  showShare = false,
  className,
}: DynamicBadgeProps) {
  const badgeRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const config = sizeConfig[size];
  const typeConfig = badgeTypeConfig[badge.type];
  const { mainLogo, siteName, primaryColor, secondaryColor } = useSiteConfig();

  // Load user photo from storage
  useEffect(() => {
    const loadUserPhoto = async () => {
      if (badge.badgePhotoUrl) {
        setPhotoUrl(badge.badgePhotoUrl);
        return;
      }

      if (badge.photoUrl) {
        setPhotoUrl(badge.photoUrl);
        return;
      }

      // Try to load from storage
      try {
        const { data: files } = await supabase.storage
          .from(STORAGE_BUCKETS.BADGES)
          .list(`achievements/${badge.userId}`, {
            limit: 1,
            sortBy: { column: "created_at", order: "desc" },
          });

        if (files && files.length > 0) {
          const latestPhoto = files[0];
          if (latestPhoto.name !== ".gitkeep") {
            const url = getStorageUrl(
              STORAGE_BUCKETS.BADGES,
              `achievements/${badge.userId}/${latestPhoto.name}`
            );
            setPhotoUrl(url);
          }
        }

        // Fallback to profile photo
        if (!photoUrl) {
          const { data: profileFiles } = await supabase.storage
            .from(STORAGE_BUCKETS.PROFILES)
            .list(`avatars/${badge.userId}`, {
              limit: 1,
              sortBy: { column: "created_at", order: "desc" },
            });

          if (profileFiles && profileFiles.length > 0) {
            const latestProfile = profileFiles[0];
            if (latestProfile.name !== ".gitkeep") {
              const url = getStorageUrl(
                STORAGE_BUCKETS.PROFILES,
                `avatars/${badge.userId}/${latestProfile.name}`
              );
              setPhotoUrl(url);
            }
          }
        }
      } catch (error) {
        console.error("Error loading user photo:", error);
      }
    };

    loadUserPhoto();
  }, [badge.userId, badge.photoUrl, badge.badgePhotoUrl]);

  // Download badge as image
  const downloadBadge = async () => {
    if (!badgeRef.current) return;

    setIsDownloading(true);
    try {
      const canvas = await html2canvas(badgeRef.current, {
        backgroundColor: badge.backgroundColor || "#ffffff",
        scale: 2,
        width: badgeRef.current.offsetWidth,
        height: badgeRef.current.offsetHeight,
      });

      const link = document.createElement("a");
      link.download = `${badge.title.replace(/\s+/g, "_")}_badge.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast.success("Badge downloaded successfully!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download badge");
    } finally {
      setIsDownloading(false);
    }
  };

  // Copy badge URL to clipboard
  const copyBadgeUrl = async () => {
    try {
      const url = `${window.location.origin}/badge/${badge.id}`;
      await navigator.clipboard.writeText(url);
      toast.success("Badge URL copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy URL");
    }
  };

  // Share badge
  const shareBadge = async () => {
    const url = `${window.location.origin}/badge/${badge.id}`;
    const text = `Check out my ${badge.title} badge from EXJAM Alumni!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: badge.title,
          text,
          url,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      await copyBadgeUrl();
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Badge Card */}
      <Card
        ref={badgeRef}
        className={cn(
          "relative overflow-hidden",
          config.container,
          badge.backgroundColor && `bg-[${badge.backgroundColor}]`
        )}
        style={{
          backgroundColor: badge.backgroundColor,
          color: badge.textColor,
        }}
      >
        {/* Header */}
        <CardHeader className="pb-4 text-center">
          {/* Organization Logo */}
          <div className="mb-2 flex justify-center">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm">
              <Image
                src={mainLogo}
                alt={`${siteName} Logo`}
                width={32}
                height={32}
                className="h-full w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/exjam-logo.svg";
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-center space-x-2">
            <div className={cn("rounded-full p-2 text-white", typeConfig.color)}>
              <typeConfig.icon className="h-4 w-4" />
            </div>
            <Badge
              variant="secondary"
              className={cn(config.badge, badge.accentColor && `bg-[${badge.accentColor}]`)}
              style={{ backgroundColor: badge.accentColor }}
            >
              {typeConfig.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 text-center">
          {/* User Photo */}
          <div className="flex justify-center">
            <div
              className={cn(
                "relative flex items-center justify-center overflow-hidden rounded-full bg-gray-200 shadow-lg ring-4 ring-white",
                config.photo
              )}
            >
              {photoUrl ? (
                <Image
                  src={photoUrl}
                  alt="Profile photo"
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : (
                <User className="h-8 w-8 text-gray-400" />
              )}
            </div>
          </div>

          {/* Badge Title */}
          <div className="space-y-1">
            <h3 className={cn("font-bold", config.title)}>{badge.title}</h3>
            {badge.subtitle && (
              <p className={cn("text-muted-foreground", config.subtitle)}>{badge.subtitle}</p>
            )}
          </div>

          {/* Event Information */}
          {badge.eventName && (
            <div className="space-y-2 text-center">
              <div className="flex items-center justify-center space-x-2 text-sm">
                <Calendar className="h-4 w-4" />
                <span>{badge.eventName}</span>
              </div>

              {badge.eventDate && (
                <div className="text-xs text-muted-foreground">
                  {badge.eventDate.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              )}

              {badge.eventLocation && (
                <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{badge.eventLocation}</span>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {badge.description && (
            <p className="line-clamp-2 text-xs text-muted-foreground">{badge.description}</p>
          )}

          {/* QR Code */}
          {badge.qrCodeUrl && (
            <div className="flex justify-center">
              <Image
                src={badge.qrCodeUrl}
                alt="QR Code"
                width={64}
                height={64}
                className="rounded border"
              />
            </div>
          )}

          {/* Issue Date */}
          <div className="border-t pt-2 text-xs text-muted-foreground">
            Issued on {badge.dateIssued.toLocaleDateString()}
          </div>
        </CardContent>

        {/* Decorative Elements */}
        <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-full bg-gradient-to-br from-white/20 to-transparent" />
        <div className="absolute bottom-0 left-0 h-16 w-16 rounded-tr-full bg-gradient-to-tr from-white/10 to-transparent" />
      </Card>

      {/* Action Buttons */}
      {(showDownload || showShare) && (
        <div className="mt-4 flex justify-center space-x-2">
          {showDownload && (
            <Button onClick={downloadBadge} disabled={isDownloading} size="sm" variant="outline">
              <Download className="mr-2 h-4 w-4" />
              {isDownloading ? "Downloading..." : "Download"}
            </Button>
          )}

          {showShare && (
            <Button onClick={shareBadge} size="sm" variant="outline">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Badge Gallery Component
interface BadgeGalleryProps {
  userId: string;
  maxBadges?: number;
  size?: "sm" | "md" | "lg";
  showActions?: boolean;
}

export function BadgeGallery({
  userId,
  maxBadges = 12,
  size = "sm",
  showActions = false,
}: BadgeGalleryProps) {
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBadges = async () => {
      try {
        // This would typically come from your database
        // For now, creating sample badges
        const sampleBadges: BadgeData[] = [
          {
            id: "1",
            userId,
            type: "registration",
            title: "EXJAM Alumni Member",
            subtitle: "Verified Member",
            description: "Official member of the EXJAM Alumni Association",
            dateIssued: new Date(),
            backgroundColor: "#f8fafc",
            textColor: "#1e293b",
            accentColor: "#3b82f6",
          },
          {
            id: "2",
            userId,
            eventId: "event-1",
            type: "attendance",
            title: "Conference Attendee 2025",
            subtitle: "Annual General Meeting",
            eventName: "EXJAM Alumni AGM 2025",
            eventDate: new Date("2025-03-15"),
            eventLocation: "Lagos, Nigeria",
            dateIssued: new Date(),
            backgroundColor: "#f0fdf4",
            textColor: "#15803d",
            accentColor: "#22c55e",
          },
        ];

        setBadges(sampleBadges.slice(0, maxBadges));
      } catch (error) {
        console.error("Error loading badges:", error);
      } finally {
        setLoading(false);
      }
    };

    loadBadges();
  }, [userId, maxBadges]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (badges.length === 0) {
    return (
      <div className="p-8 text-center">
        <Medal className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">No badges earned yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Attend events and complete achievements to earn badges!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Achievement Badges</h3>
        <Badge variant="secondary">
          {badges.length} Badge{badges.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      <div
        className={cn(
          "grid gap-6",
          size === "sm"
            ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            : size === "md"
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1 md:grid-cols-2"
        )}
      >
        {badges.map((badge) => (
          <DynamicBadge
            key={badge.id}
            badge={badge}
            size={size}
            showDownload={showActions}
            showShare={showActions}
          />
        ))}
      </div>
    </div>
  );
}

// Badge generation utility
export const generateBadge = async (
  data: Omit<BadgeData, "id" | "dateIssued">
): Promise<BadgeData> => {
  return {
    ...data,
    id: crypto.randomUUID(),
    dateIssued: new Date(),
  };
};
