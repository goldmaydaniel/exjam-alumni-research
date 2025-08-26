"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, Check, AlertCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface IntelligentFaceCaptureProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
}

export function IntelligentFaceCapture({ onCapture, onCancel }: IntelligentFaceCaptureProps) {
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
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // const [faceBoundingBox, setFaceBoundingBox] = useState<DOMRect | null>(null);

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
        // Safari-specific video setup
        const video = videoRef.current;

        // Set video attributes for better Safari compatibility
        video.setAttribute("autoplay", "");
        video.setAttribute("muted", "");
        video.setAttribute("playsinline", "");

        video.srcObject = stream;
        streamRef.current = stream;

        // Multiple event handlers for better compatibility
        let loadHandled = false;

        const handleVideoReady = () => {
          if (loadHandled) return;
          loadHandled = true;

          // Ensure video is playing
          video
            .play()
            .then(() => {
              setIsLoading(false);
              setRetryCount(0);
              startFaceDetection();
              toast.success("Camera initialized successfully");
            })
            .catch((playError) => {
              console.error("Video play error:", playError);
              // Try playing again after a short delay
              setTimeout(() => {
                video.play().catch(() => {
                  setCameraError("Unable to start video playback");
                  setIsLoading(false);
                });
              }, 100);
            });
        };

        // Use multiple events for better compatibility
        video.onloadedmetadata = handleVideoReady;
        video.onloadeddata = handleVideoReady;
        video.oncanplay = handleVideoReady;

        // Monitor video ready state
        const checkReadyState = setInterval(() => {
          if (video.readyState >= 3) {
            // HAVE_FUTURE_DATA
            clearInterval(checkReadyState);
            handleVideoReady();
          }
        }, 100);

        // Cleanup interval after 5 seconds
        setTimeout(() => clearInterval(checkReadyState), 5000);
      }
    } catch (error: any) {
      console.error("Camera error:", error);

      // Clear timeout
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

        toast.success("Photo captured successfully!");
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

  // Confirm captured image
  const confirmCapture = () => {
    if (capturedImage) {
      onCapture(capturedImage);
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
      // Cleanup timeout
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      // Cleanup stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [startCamera]);

  if (capturedImage) {
    return (
      <div className="space-y-4">
        <div className="relative mx-auto w-full max-w-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={capturedImage} alt="Captured photo" className="w-full rounded-lg shadow-lg" />
          <div className="absolute right-2 top-2 rounded-full bg-green-500 p-2 text-white">
            <Check className="h-5 w-5" />
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <Button onClick={retakePhoto} variant="outline">
            <Camera className="mr-2 h-4 w-4" />
            Retake Photo
          </Button>
          <Button onClick={confirmCapture}>
            <Check className="mr-2 h-4 w-4" />
            Use This Photo
          </Button>
        </div>
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
        <div className="flex items-center justify-center gap-2">
          <input
            type="checkbox"
            id="autoCapture"
            checked={autoCapture}
            onChange={(e) => setAutoCapture(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="autoCapture" className="text-sm text-muted-foreground">
            Auto-capture when face is detected
          </label>
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
