"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, Check, AlertCircle, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { StorageManager } from "@/lib/storage-management";
import { AssetManager } from "@/lib/supabase/storage";
import { useAuthStore } from "@/lib/store/consolidated-auth";

interface PhotoCaptureData {
  imageDataUrl: string;
  profilePhotoUrl?: string;
  badgePhotoUrl?: string;
  file?: File;
}

interface EnhancedPhotoCaptureProps {
  onCapture: (data: PhotoCaptureData) => void;
  onCancel: () => void;
  saveToStorage?: boolean;
  generateBadgePhoto?: boolean;
  userId?: string;
  eventId?: string;
}

export function EnhancedPhotoCapture({
  onCapture,
  onCancel,
  saveToStorage = true,
  generateBadgePhoto = true,
  userId,
  eventId,
}: EnhancedPhotoCaptureProps) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [autoCapture, setAutoCapture] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Convert data URL to File
  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  // Generate badge-compatible photo
  const generateBadgePhoto = useCallback(async (originalImageData: string): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Badge photo specifications
        const badgeSize = 400; // 400x400 for badges
        canvas.width = badgeSize;
        canvas.height = badgeSize;

        if (ctx) {
          // Create circular crop for badge
          ctx.beginPath();
          ctx.arc(badgeSize / 2, badgeSize / 2, badgeSize / 2, 0, Math.PI * 2);
          ctx.clip();

          // Calculate dimensions to fit the face in center
          const { width, height } = img;
          const scale = Math.max(badgeSize / width, badgeSize / height);
          const scaledWidth = width * scale;
          const scaledHeight = height * scale;

          // Center the image
          const x = (badgeSize - scaledWidth) / 2;
          const y = (badgeSize - scaledHeight) / 2;

          // Draw image
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

          // Add badge border
          ctx.restore();
          ctx.beginPath();
          ctx.arc(badgeSize / 2, badgeSize / 2, badgeSize / 2 - 5, 0, Math.PI * 2);
          ctx.strokeStyle = "#3b82f6";
          ctx.lineWidth = 10;
          ctx.stroke();
        }

        resolve(canvas.toDataURL("image/png", 0.95));
      };

      img.src = originalImageData;
    });
  }, []);

  // Upload photos to storage
  const uploadPhotos = useCallback(
    async (imageDataUrl: string): Promise<PhotoCaptureData> => {
      if (!saveToStorage) {
        return { imageDataUrl };
      }

      setIsUploading(true);
      const currentUserId = userId || user?.id;

      try {
        // Convert to file
        const timestamp = Date.now();
        const fileName = `photo-${timestamp}.jpg`;
        const file = dataURLtoFile(imageDataUrl, fileName);

        const results: PhotoCaptureData = {
          imageDataUrl,
          file,
        };

        // Upload profile photo
        const profileResult = await AssetManager.uploadAvatar(file, currentUserId || "anonymous");

        if (profileResult.error) {
          toast.error(`Profile photo upload failed: ${profileResult.error}`);
        } else {
          results.profilePhotoUrl = profileResult.url;
          toast.success("Profile photo uploaded successfully!");
        }

        // Generate and upload badge photo if requested
        if (generateBadgePhoto) {
          const badgeImageData = await generateBadgePhoto(imageDataUrl);
          const badgeFile = dataURLtoFile(badgeImageData, `badge-${timestamp}.png`);

          const badgeResult = await AssetManager.uploadBadge(
            badgeFile,
            "achievement",
            currentUserId || "anonymous"
          );

          if (badgeResult.error) {
            toast.error(`Badge photo upload failed: ${badgeResult.error}`);
          } else {
            results.badgePhotoUrl = badgeResult.url;
            toast.success("Badge photo generated and uploaded!");
          }
        }

        return results;
      } catch (error) {
        console.error("Photo upload error:", error);
        toast.error("Failed to upload photos");
        return { imageDataUrl };
      } finally {
        setIsUploading(false);
      }
    },
    [saveToStorage, generateBadgePhoto, userId, user?.id]
  );

  // Face detection using canvas
  const startFaceDetection = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Set canvas size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const detectFace = () => {
      if (!video.paused && !video.ended) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Simple face detection based on center area and brightness
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const faceRadius = Math.min(canvas.width, canvas.height) * 0.25;

        // Get image data from center area
        const imageData = ctx.getImageData(
          centerX - faceRadius,
          centerY - faceRadius,
          faceRadius * 2,
          faceRadius * 2
        );

        // Check if there's enough contrast (likely a face)
        const pixels = imageData.data;
        let totalBrightness = 0;
        let pixelCount = 0;

        for (let i = 0; i < pixels.length; i += 4) {
          const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
          totalBrightness += brightness;
          pixelCount++;
        }

        const avgBrightness = totalBrightness / pixelCount;
        const faceDetected = avgBrightness > 50 && avgBrightness < 200;

        setIsFaceDetected(faceDetected);

        requestAnimationFrame(detectFace);
      }
    };

    detectFace();
  }, []);

  // Check for Safari and getUserMedia compatibility
  const checkCameraCompatibility = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // Fallback for older browsers
      const getUserMedia =
        (navigator as any).getUserMedia ||
        (navigator as any).webkitGetUserMedia ||
        (navigator as any).mozGetUserMedia ||
        (navigator as any).msGetUserMedia;

      if (!getUserMedia) {
        return { supported: false, message: "Camera access is not supported in this browser" };
      }

      // Polyfill for older browsers
      navigator.mediaDevices = {
        getUserMedia: (constraints) => {
          return new Promise((resolve, reject) => {
            getUserMedia.call(navigator, constraints, resolve, reject);
          });
        },
      } as MediaDevices;
    }

    // Check if we're on iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    return {
      supported: true,
      isIOS,
      isSafari,
      message: null,
    };
  };

  // Initialize camera with timeout and retry mechanism
  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setCameraError(null);

      // Check compatibility first
      const compatibility = checkCameraCompatibility();
      if (!compatibility.supported) {
        throw new Error(compatibility.message || "Camera not supported");
      }

      // Clear any existing timeout
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }

      // Set a timeout for camera initialization
      const timeoutPromise = new Promise((_, reject) => {
        initTimeoutRef.current = setTimeout(() => {
          reject(new Error("Camera initialization timed out. Please try again."));
        }, 10000); // 10 second timeout
      });

      // Safari-specific constraints
      const constraints: MediaStreamConstraints = {
        video: compatibility.isSafari
          ? {
              width: { min: 640, ideal: 1280, max: 1920 },
              height: { min: 480, ideal: 720, max: 1080 },
              facingMode: "user",
              aspectRatio: { ideal: 1.7777777778 },
            }
          : {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            },
        audio: false,
      };

      // Race between getUserMedia and timeout
      const stream = (await Promise.race([
        navigator.mediaDevices.getUserMedia(constraints),
        timeoutPromise,
      ])) as MediaStream;

      // Clear timeout if successful
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }

      if (videoRef.current) {
        const video = videoRef.current;

        video.setAttribute("autoplay", "");
        video.setAttribute("muted", "");
        video.setAttribute("playsinline", "");

        video.srcObject = stream;
        streamRef.current = stream;

        let loadHandled = false;

        const handleVideoReady = () => {
          if (loadHandled) return;
          loadHandled = true;

          video
            .play()
            .then(() => {
              setIsLoading(false);
              setRetryCount(0);
              startFaceDetection();
              toast.success("Camera ready for photo capture");
            })
            .catch((playError) => {
              console.error("Video play error:", playError);
              setTimeout(() => {
                video.play().catch(() => {
                  setCameraError("Unable to start video playback");
                  setIsLoading(false);
                });
              }, 100);
            });
        };

        video.onloadedmetadata = handleVideoReady;
        video.onloadeddata = handleVideoReady;
        video.oncanplay = handleVideoReady;

        const checkReadyState = setInterval(() => {
          if (video.readyState >= 3) {
            clearInterval(checkReadyState);
            handleVideoReady();
          }
        }, 100);

        setTimeout(() => clearInterval(checkReadyState), 5000);
      }
    } catch (error: any) {
      console.error("Camera error:", error);

      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }

      let errorMessage = "Unable to access camera.";

      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        errorMessage = "Camera permission denied. Please allow camera access and reload the page.";
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        errorMessage = "No camera found. Please connect a camera and try again.";
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        errorMessage = "Camera is already in use by another application.";
      } else if (
        error.name === "OverconstrainedError" ||
        error.name === "ConstraintNotSatisfiedError"
      ) {
        errorMessage = "Camera doesn't support the required resolution.";
      } else if (error.message?.includes("timeout")) {
        errorMessage = error.message;
      }

      setCameraError(errorMessage);
      setIsLoading(false);

      // Auto-retry logic for timeouts
      if (retryCount < 3 && error.message?.includes("timeout")) {
        setIsRetrying(true);
        toast.error(`Camera initialization failed. Retrying... (${retryCount + 1}/3)`);
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          setIsRetrying(false);
          startCamera();
        }, 2000);
      } else {
        toast.error(errorMessage);
      }
    }
  }, [startFaceDetection, retryCount]);

  // Capture photo with countdown
  const handleCapture = useCallback(async () => {
    if (isCapturing || !videoRef.current) return;

    setIsCapturing(true);
    setCountdown(3);

    // Countdown
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setCountdown(null);

    // Capture the photo
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw the video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to data URL
        const imageData = canvas.toDataURL("image/jpeg", 0.95);
        setCapturedImage(imageData);

        // Stop the camera
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }

        toast.success("Photo captured! Processing...");
      }
    }

    setIsCapturing(false);
  }, [isCapturing]);

  // Auto capture when face is detected
  useEffect(() => {
    if (isFaceDetected && autoCapture && !isCapturing && !capturedImage) {
      const timer = setTimeout(() => {
        handleCapture();
      }, 2000); // Wait 2 seconds after face detection

      return () => clearTimeout(timer);
    }
  }, [isFaceDetected, autoCapture, isCapturing, capturedImage, handleCapture]);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCapturedImage(result);
        toast.success("Photo uploaded successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  // Confirm captured image and upload
  const confirmCapture = async () => {
    if (capturedImage) {
      const photoData = await uploadPhotos(capturedImage);
      onCapture(photoData);
    }
  };

  // Retake photo
  const retakePhoto = () => {
    setCapturedImage(null);
    setIsFaceDetected(false);
    setRetryCount(0);
    startCamera();
  };

  // Manual retry function
  const retryCamera = () => {
    setRetryCount(0);
    setCameraError(null);
    startCamera();
  };

  // Cleanup on unmount
  useEffect(() => {
    startCamera();

    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [startCamera]);

  if (capturedImage) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Original Photo */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Profile Photo</h3>
            <div className="relative mx-auto w-full max-w-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedImage}
                alt="Profile photo"
                className="w-full rounded-lg shadow-lg"
              />
              <div className="absolute right-2 top-2 rounded-full bg-green-500 p-2 text-white">
                <Check className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Badge Photo Preview */}
          {generateBadgePhoto && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Badge Photo Preview</h3>
              <div className="relative mx-auto h-64 w-64">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={capturedImage}
                  alt="Badge preview"
                  className="h-full w-full rounded-full border-4 border-blue-500 object-cover shadow-lg"
                />
                <div className="absolute right-2 top-2 rounded-full bg-blue-500 p-1 text-white">
                  <Check className="h-4 w-4" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-4">
          <Button onClick={retakePhoto} variant="outline" disabled={isUploading}>
            <Camera className="mr-2 h-4 w-4" />
            Retake Photo
          </Button>
          <Button onClick={confirmCapture} disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Use These Photos
              </>
            )}
          </Button>
        </div>

        {saveToStorage && (
          <div className="text-center text-sm text-muted-foreground">
            {generateBadgePhoto
              ? "Photos will be saved to your profile and badge gallery"
              : "Photo will be saved to your profile"}
          </div>
        )}
      </div>
    );
  }

  if (cameraError) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>{cameraError}</p>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          {!isRetrying && (
            <Button onClick={retryCamera} variant="default">
              <Camera className="mr-2 h-4 w-4" />
              Retry Camera
            </Button>
          )}
          <Button onClick={() => fileInputRef.current?.click()} variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Upload Photo Instead
          </Button>
          <Button onClick={onCancel} variant="ghost">
            Cancel
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative mx-auto w-full max-w-md">
        {/* Video feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            "w-full scale-x-[-1] transform rounded-lg shadow-lg", // Mirror effect
            isLoading && "opacity-0"
          )}
        />

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Face detection overlay */}
        {!isLoading && (
          <div className="pointer-events-none absolute inset-0">
            {/* Face guide circle */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
              <div
                className={cn(
                  "h-48 w-48 rounded-full border-4 transition-colors duration-300",
                  isFaceDetected
                    ? "border-green-500 bg-green-500/10"
                    : "border-gray-400 bg-gray-400/10"
                )}
              >
                {!isFaceDetected && (
                  <div className="flex h-full items-center justify-center">
                    <User className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Status indicator */}
            <div className="absolute left-1/2 top-4 -translate-x-1/2 transform">
              <div
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-all",
                  isFaceDetected ? "bg-green-500 text-white" : "bg-gray-700 text-white"
                )}
              >
                {isFaceDetected ? "Face detected - Hold still" : "Position your face in the circle"}
              </div>
            </div>

            {/* Countdown overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="animate-pulse text-8xl font-bold text-white">{countdown}</div>
              </div>
            )}
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-gray-100">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">
                {isRetrying ? `Retrying camera... (${retryCount}/3)` : "Initializing camera..."}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                This may take a few seconds on Safari
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoCapture"
              checked={autoCapture}
              onChange={(e) => setAutoCapture(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="autoCapture" className="text-muted-foreground">
              Auto-capture
            </label>
          </div>

          {saveToStorage && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="generateBadge"
                checked={generateBadgePhoto}
                onChange={(e) => setGenerateBadgePhoto(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="generateBadge" className="text-muted-foreground">
                Generate badge photo
              </label>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-4">
          <Button onClick={handleCapture} disabled={isCapturing || isLoading} size="lg">
            {isCapturing ? (
              <>Capturing...</>
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                Capture Photo
              </>
            )}
          </Button>

          <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="lg">
            <Upload className="mr-2 h-4 w-4" />
            Upload Instead
          </Button>

          <Button onClick={onCancel} variant="ghost" size="lg">
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>
    </div>
  );
}
