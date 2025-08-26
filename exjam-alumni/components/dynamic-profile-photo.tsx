"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { User, Camera, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
import { STORAGE_BUCKETS, getStorageUrl } from "@/lib/supabase/storage";
import { AssetManager } from "@/lib/supabase/storage";
import { toast } from "sonner";

interface DynamicProfilePhotoProps {
  userId: string;
  size?: "sm" | "md" | "lg" | "xl";
  editable?: boolean;
  showBadgeVersion?: boolean;
  className?: string;
  onPhotoUpdate?: (photoUrl: string) => void;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-20 h-20",
  xl: "w-32 h-32",
};

export function DynamicProfilePhoto({
  userId,
  size = "md",
  editable = false,
  showBadgeVersion = false,
  className,
  onPhotoUpdate,
}: DynamicProfilePhotoProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [badgePhotoUrl, setBadgePhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load profile photos from storage
  const loadProfilePhotos = async () => {
    try {
      setLoading(true);
      setError(null);

      // List user's profile photos
      const { data: profileFiles, error: profileError } = await supabase.storage
        .from(STORAGE_BUCKETS.PROFILES)
        .list(`avatars/${userId}`, {
          limit: 10,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (profileError) {
        console.error("Error loading profile photos:", profileError);
        setError("Failed to load profile photo");
        return;
      }

      // Get the most recent profile photo
      const latestProfilePhoto = profileFiles?.find(
        (file) => file.name.includes("avatar") || file.name.includes("photo")
      );

      if (latestProfilePhoto) {
        const profileUrl = getStorageUrl(
          STORAGE_BUCKETS.PROFILES,
          `avatars/${userId}/${latestProfilePhoto.name}`
        );
        setPhotoUrl(profileUrl);
      }

      // Load badge photo if requested
      if (showBadgeVersion) {
        const { data: badgeFiles, error: badgeError } = await supabase.storage
          .from(STORAGE_BUCKETS.BADGES)
          .list(`achievements/${userId}`, {
            limit: 10,
            sortBy: { column: "created_at", order: "desc" },
          });

        if (!badgeError && badgeFiles?.length > 0) {
          const latestBadgePhoto = badgeFiles.find(
            (file) => file.name.includes("badge") || file.name.includes("achievement")
          );

          if (latestBadgePhoto) {
            const badgeUrl = getStorageUrl(
              STORAGE_BUCKETS.BADGES,
              `achievements/${userId}/${latestBadgePhoto.name}`
            );
            setBadgePhotoUrl(badgeUrl);
          }
        }
      }
    } catch (error) {
      console.error("Error loading photos:", error);
      setError("Failed to load photos");
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setUploading(true);

    try {
      // Upload new profile photo
      const result = await AssetManager.uploadAvatar(file, userId);

      if (result.error) {
        toast.error(`Upload failed: ${result.error}`);
        return;
      }

      if (result.url) {
        setPhotoUrl(result.url);
        toast.success("Profile photo updated successfully!");

        if (onPhotoUpdate) {
          onPhotoUpdate(result.url);
        }

        // Reload to get updated photos
        await loadProfilePhotos();
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  // Load photos on component mount
  useEffect(() => {
    if (userId) {
      loadProfilePhotos();
    }
  }, [userId, showBadgeVersion]);

  const displayUrl = showBadgeVersion && badgePhotoUrl ? badgePhotoUrl : photoUrl;

  return (
    <div className={cn("relative inline-block", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-full bg-muted",
          sizeClasses[size],
          showBadgeVersion && "ring-4 ring-blue-500 ring-offset-2"
        )}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : displayUrl ? (
          <Image
            src={displayUrl}
            alt={showBadgeVersion ? "Badge photo" : "Profile photo"}
            fill
            className="object-cover"
            sizes={`(max-width: 768px) 100vw, ${size === "xl" ? "128px" : size === "lg" ? "80px" : size === "md" ? "48px" : "32px"}`}
            onError={() => {
              setError("Failed to load image");
              if (showBadgeVersion) {
                setBadgePhotoUrl(null);
              } else {
                setPhotoUrl(null);
              }
            }}
          />
        ) : (
          <User
            className={cn(
              "text-muted-foreground",
              size === "xl"
                ? "h-16 w-16"
                : size === "lg"
                  ? "h-10 w-10"
                  : size === "md"
                    ? "h-6 w-6"
                    : "h-4 w-4"
            )}
          />
        )}

        {/* Upload overlay for editable photos */}
        {editable && !uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100">
            <label className="cursor-pointer">
              <Camera className="h-4 w-4 text-white" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
            </label>
          </div>
        )}

        {/* Upload loading overlay */}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          </div>
        )}

        {/* Badge indicator */}
        {showBadgeVersion && badgePhotoUrl && (
          <div className="absolute -bottom-1 -right-1 rounded-full bg-blue-500 p-1 text-white">
            <div className="h-2 w-2 rounded-full bg-white" />
          </div>
        )}
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-red-100">
          <User className="h-4 w-4 text-red-500" />
        </div>
      )}
    </div>
  );
}

// Profile photo gallery component
interface ProfilePhotoGalleryProps {
  userId: string;
  onSelectPhoto?: (photoUrl: string) => void;
  maxPhotos?: number;
}

export function ProfilePhotoGallery({
  userId,
  onSelectPhoto,
  maxPhotos = 10,
}: ProfilePhotoGalleryProps) {
  const [photos, setPhotos] = useState<
    Array<{
      name: string;
      url: string;
      created_at: string;
      type: "profile" | "badge";
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const loadPhotoGallery = async () => {
    try {
      setLoading(true);
      const allPhotos: any[] = [];

      // Load profile photos
      const { data: profileFiles } = await supabase.storage
        .from(STORAGE_BUCKETS.PROFILES)
        .list(`avatars/${userId}`, {
          limit: maxPhotos,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (profileFiles) {
        profileFiles.forEach((file) => {
          if (file.name !== ".gitkeep") {
            allPhotos.push({
              name: file.name,
              url: getStorageUrl(STORAGE_BUCKETS.PROFILES, `avatars/${userId}/${file.name}`),
              created_at: file.created_at,
              type: "profile",
            });
          }
        });
      }

      // Load badge photos
      const { data: badgeFiles } = await supabase.storage
        .from(STORAGE_BUCKETS.BADGES)
        .list(`achievements/${userId}`, {
          limit: maxPhotos,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (badgeFiles) {
        badgeFiles.forEach((file) => {
          if (file.name !== ".gitkeep") {
            allPhotos.push({
              name: file.name,
              url: getStorageUrl(STORAGE_BUCKETS.BADGES, `achievements/${userId}/${file.name}`),
              created_at: file.created_at,
              type: "badge",
            });
          }
        });
      }

      // Sort by creation date
      allPhotos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setPhotos(allPhotos.slice(0, maxPhotos));
    } catch (error) {
      console.error("Error loading photo gallery:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadPhotoGallery();
    }
  }, [userId, maxPhotos]);

  const handlePhotoSelect = (photo: (typeof photos)[0]) => {
    setSelectedPhoto(photo.url);
    if (onSelectPhoto) {
      onSelectPhoto(photo.url);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="p-8 text-center">
        <User className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">No photos uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Photo Gallery</h3>

      <div className="grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-6">
        {photos.map((photo, index) => (
          <div
            key={photo.name}
            className={cn(
              "relative aspect-square cursor-pointer overflow-hidden rounded-lg",
              "ring-2 ring-transparent transition-all hover:ring-blue-500",
              selectedPhoto === photo.url && "ring-blue-500",
              photo.type === "badge" && "ring-offset-2"
            )}
            onClick={() => handlePhotoSelect(photo)}
          >
            <Image
              src={photo.url}
              alt={`Photo ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 33vw, (max-width: 1200px) 25vw, 16vw"
            />

            {/* Photo type indicator */}
            <div className="absolute right-2 top-2">
              {photo.type === "badge" ? (
                <div className="rounded bg-blue-500 px-2 py-1 text-xs text-white">Badge</div>
              ) : (
                <div className="rounded bg-green-500 px-2 py-1 text-xs text-white">Profile</div>
              )}
            </div>

            {/* Selection indicator */}
            {selectedPhoto === photo.url && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20">
                <div className="rounded-full bg-blue-500 p-2 text-white">
                  <Camera className="h-4 w-4" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-sm text-muted-foreground">
        {photos.length} photo{photos.length !== 1 ? "s" : ""} in gallery
      </div>
    </div>
  );
}
