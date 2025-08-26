"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, Check, AlertCircle, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface SmartPhotoCaptureProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
  showPreview?: boolean;
}

interface FaceDetection {
  detected: boolean;
  confidence: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

export function SmartPhotoCapture({
  onCapture,
  onCancel,
  showPreview = true,
}: SmartPhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionRef = useRef<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [faceDetection, setFaceDetection] = useState<FaceDetection>({
    detected: false,
    confidence: 0,
    centerX: 0,
    centerY: 0,
    width: 0,
    height: 0,
  });
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [autoCapture, setAutoCapture] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [detectionHistory, setDetectionHistory] = useState<boolean[]>([]);

  // Advanced face detection using edge detection and skin tone analysis
  const detectFace = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || isLoading) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || video.paused || video.ended) return;

    // Set canvas dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data for analysis
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Face detection parameters
    const minFaceSize = Math.min(canvas.width, canvas.height) * 0.15;
    const maxFaceSize = Math.min(canvas.width, canvas.height) * 0.5;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const searchRadius = Math.min(canvas.width, canvas.height) * 0.3;

    let bestMatch = {
      detected: false,
      confidence: 0,
      centerX,
      centerY,
      width: 0,
      height: 0,
    };

    // Multi-step face detection
    const regions = [
      {
        x: centerX - searchRadius / 2,
        y: centerY - searchRadius / 2,
        w: searchRadius,
        h: searchRadius,
      },
      {
        x: centerX - searchRadius / 3,
        y: centerY - searchRadius / 3,
        w: (searchRadius * 2) / 3,
        h: (searchRadius * 2) / 3,
      },
    ];

    regions.forEach((region) => {
      const detection = analyzeRegion(data, canvas.width, canvas.height, region);
      if (detection.confidence > bestMatch.confidence) {
        bestMatch = detection;
      }
    });

    // Smooth detection with history
    setDetectionHistory((prev) => {
      const newHistory = [...prev, bestMatch.detected].slice(-10); // Keep last 10 detections
      const stableDetection = newHistory.slice(-5).filter(Boolean).length >= 3; // 3 out of 5

      if (
        stableDetection !== faceDetection.detected ||
        bestMatch.confidence > faceDetection.confidence
      ) {
        setFaceDetection({
          ...bestMatch,
          detected: stableDetection,
          confidence: Math.max(bestMatch.confidence, faceDetection.confidence * 0.8), // Smooth confidence
        });
      }

      return newHistory;
    });

    // Continue detection
    detectionRef.current = requestAnimationFrame(detectFace);
  }, [isLoading, faceDetection.detected, faceDetection.confidence]);

  // Analyze a region for face-like characteristics
  const analyzeRegion = (
    data: Uint8ClampedArray,
    width: number,
    height: number,
    region: { x: number; y: number; w: number; h: number }
  ): FaceDetection => {
    const { x, y, w, h } = region;
    const startX = Math.max(0, Math.floor(x));
    const startY = Math.max(0, Math.floor(y));
    const endX = Math.min(width, Math.floor(x + w));
    const endY = Math.min(height, Math.floor(y + h));

    let skinPixels = 0;
    let totalPixels = 0;
    let brightnessSum = 0;
    let contrastSum = 0;
    let edgePixels = 0;

    // Analyze pixels in the region
    for (let py = startY; py < endY; py++) {
      for (let px = startX; px < endX; px++) {
        const i = (py * width + px) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Skin tone detection (improved algorithm)
        const isSkin = detectSkinTone(r, g, b);
        if (isSkin) skinPixels++;

        // Brightness analysis
        const brightness = (r + g + b) / 3;
        brightnessSum += brightness;

        // Edge detection (simple Sobel)
        if (px > 0 && py > 0 && px < width - 1 && py < height - 1) {
          const edgeStrength = calculateEdgeStrength(data, px, py, width);
          if (edgeStrength > 50) edgePixels++;
          contrastSum += edgeStrength;
        }

        totalPixels++;
      }
    }

    // Calculate metrics
    const skinRatio = totalPixels > 0 ? skinPixels / totalPixels : 0;
    const avgBrightness = totalPixels > 0 ? brightnessSum / totalPixels : 0;
    const avgContrast = totalPixels > 0 ? contrastSum / totalPixels : 0;
    const edgeRatio = totalPixels > 0 ? edgePixels / totalPixels : 0;

    // Face detection scoring
    let confidence = 0;

    // Skin tone score (25% of confidence)
    if (skinRatio > 0.3 && skinRatio < 0.8) {
      confidence += 25 * Math.min(skinRatio / 0.5, 1);
    }

    // Brightness score (25% of confidence) - faces are typically in good lighting
    if (avgBrightness > 80 && avgBrightness < 200) {
      confidence += 25 * (1 - Math.abs(avgBrightness - 140) / 60);
    }

    // Contrast score (25% of confidence) - faces have good contrast
    if (avgContrast > 20 && avgContrast < 100) {
      confidence += 25 * (avgContrast / 60);
    }

    // Edge detection score (25% of confidence) - faces have defined features
    if (edgeRatio > 0.1 && edgeRatio < 0.4) {
      confidence += 25 * (edgeRatio / 0.25);
    }

    const detected = confidence > 60; // Threshold for detection

    return {
      detected,
      confidence,
      centerX: x + w / 2,
      centerY: y + h / 2,
      width: w,
      height: h,
    };
  };

  // Improved skin tone detection
  const detectSkinTone = (r: number, g: number, b: number): boolean => {
    // Convert to HSV for better skin detection
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    const v = max / 255;
    const s = max === 0 ? 0 : diff / max;

    let h = 0;
    if (diff !== 0) {
      if (max === r) h = ((g - b) / diff + 6) % 6;
      else if (max === g) h = (b - r) / diff + 2;
      else h = (r - g) / diff + 4;
    }
    h *= 60;

    // Skin tone ranges in HSV
    const skinConditions = [
      h >= 0 && h <= 50 && s >= 0.23 && s <= 0.68 && v >= 0.35 && v <= 0.95,
      h >= 300 && h <= 360 && s >= 0.2 && s <= 0.65 && v >= 0.4 && v <= 0.9,
    ];

    // Additional RGB-based skin detection
    const rgbSkin =
      r > 95 &&
      g > 40 &&
      b > 20 &&
      Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
      Math.abs(r - g) > 15 &&
      r > g &&
      r > b;

    return skinConditions.some((condition) => condition) || rgbSkin;
  };

  // Calculate edge strength using Sobel operator
  const calculateEdgeStrength = (
    data: Uint8ClampedArray,
    x: number,
    y: number,
    width: number
  ): number => {
    const getGray = (px: number, py: number) => {
      const i = (py * width + px) * 4;
      return (data[i] + data[i + 1] + data[i + 2]) / 3;
    };

    // Sobel X kernel
    const gx =
      -getGray(x - 1, y - 1) +
      getGray(x + 1, y - 1) +
      -2 * getGray(x - 1, y) +
      2 * getGray(x + 1, y) +
      -getGray(x - 1, y + 1) +
      getGray(x + 1, y + 1);

    // Sobel Y kernel
    const gy =
      -getGray(x - 1, y - 1) -
      2 * getGray(x, y - 1) -
      getGray(x + 1, y - 1) +
      getGray(x - 1, y + 1) +
      2 * getGray(x, y + 1) +
      getGray(x + 1, y + 1);

    return Math.sqrt(gx * gx + gy * gy);
  };

  // Start face detection loop
  const startFaceDetection = useCallback(() => {
    if (detectionRef.current) {
      cancelAnimationFrame(detectionRef.current);
    }
    detectionRef.current = requestAnimationFrame(detectFace);
  }, [detectFace]);

  // Initialize camera
  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setCameraError(null);

      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: "user",
          frameRate: { ideal: 30, max: 60 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;

        video.onloadedmetadata = () => {
          video
            .play()
            .then(() => {
              setIsLoading(false);
              setRetryCount(0);
              startFaceDetection();
              toast.success("Camera ready! Position your face in the frame.");
            })
            .catch((err) => {
              console.error("Video play error:", err);
              setCameraError("Failed to start video playback");
              setIsLoading(false);
            });
        };
      }
    } catch (error: any) {
      console.error("Camera initialization error:", error);

      let errorMessage = "Camera access failed. ";
      if (error.name === "NotAllowedError") {
        errorMessage = "Camera permission denied. Please allow camera access and reload.";
      } else if (error.name === "NotFoundError") {
        errorMessage = "No camera found. Please connect a camera.";
      } else if (error.name === "NotReadableError") {
        errorMessage = "Camera is already in use by another application.";
      }

      setCameraError(errorMessage);
      setIsLoading(false);

      if (retryCount < 2) {
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          startCamera();
        }, 3000);
      }
    }
  }, [startFaceDetection, retryCount]);

  // Capture photo with countdown
  const handleCapture = useCallback(async () => {
    if (isCapturing || !videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);

    // Quick countdown
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
    setCountdown(null);

    // Capture the photo
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw and flip image for natural selfie feel
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);

      const imageData = canvas.toDataURL("image/jpeg", 0.92);
      setCapturedImage(imageData);

      // Stop camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (detectionRef.current) {
        cancelAnimationFrame(detectionRef.current);
      }

      toast.success("Perfect shot captured! 📸");
    }

    setIsCapturing(false);
  }, [isCapturing]);

  // Auto capture when stable face detected
  useEffect(() => {
    if (
      faceDetection.detected &&
      faceDetection.confidence > 75 &&
      autoCapture &&
      !isCapturing &&
      !capturedImage &&
      detectionHistory.slice(-8).filter(Boolean).length >= 6
    ) {
      const timer = setTimeout(() => {
        handleCapture();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [faceDetection, autoCapture, isCapturing, capturedImage, detectionHistory, handleCapture]);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setCapturedImage(reader.result as string);
      toast.success("Photo uploaded successfully!");
    };
    reader.readAsDataURL(file);
  };

  // Initialize on mount
  useEffect(() => {
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (detectionRef.current) {
        cancelAnimationFrame(detectionRef.current);
      }
    };
  }, [startCamera]);

  // Render captured image preview
  if (capturedImage && showPreview) {
    return (
      <div className="space-y-6">
        <div className="relative mx-auto w-full max-w-sm">
          <div className="relative overflow-hidden rounded-2xl shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={capturedImage} alt="Captured photo" className="w-full object-cover" />
            <div className="absolute right-3 top-3 rounded-full bg-green-500 p-2 shadow-lg">
              <Check className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <Button
            onClick={() => {
              setCapturedImage(null);
              setFaceDetection({
                detected: false,
                confidence: 0,
                centerX: 0,
                centerY: 0,
                width: 0,
                height: 0,
              });
              startCamera();
            }}
            variant="outline"
            size="lg"
          >
            <Camera className="mr-2 h-4 w-4" />
            Retake
          </Button>
          <Button onClick={() => onCapture(capturedImage)} size="lg">
            <Check className="mr-2 h-4 w-4" />
            Use This Photo
          </Button>
        </div>
      </div>
    );
  }

  // Render error state
  if (cameraError) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="h-6 w-6" />
            <div>
              <h3 className="font-semibold">Camera Error</h3>
              <p className="text-sm">{cameraError}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <Button onClick={startCamera} size="lg">
            <Camera className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="lg">
            <Upload className="mr-2 h-4 w-4" />
            Upload Photo
          </Button>
          <Button onClick={onCancel} variant="ghost" size="lg">
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

  // Main camera interface
  return (
    <div className="space-y-6">
      <div className="relative mx-auto w-full max-w-sm">
        <div className="relative overflow-hidden rounded-2xl bg-gray-900 shadow-2xl">
          {/* Video feed */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={cn(
              "w-full scale-x-[-1] transform bg-gray-900", // Mirror effect
              isLoading && "opacity-0"
            )}
          />

          {/* Hidden canvas for processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Face detection overlay */}
          {!isLoading && (
            <div className="pointer-events-none absolute inset-0">
              {/* Smart face guide */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
                <div
                  className={cn(
                    "relative h-48 w-48 rounded-full border-4 transition-all duration-500",
                    faceDetection.detected && faceDetection.confidence > 70
                      ? "scale-105 border-green-400 bg-green-400/20 shadow-lg shadow-green-400/50"
                      : faceDetection.detected && faceDetection.confidence > 50
                        ? "border-yellow-400 bg-yellow-400/20 shadow-lg shadow-yellow-400/50"
                        : "border-blue-400 bg-blue-400/10 shadow-lg shadow-blue-400/30"
                  )}
                >
                  {/* Face icon when not detected */}
                  {!faceDetection.detected && (
                    <div className="flex h-full items-center justify-center">
                      <User className="h-20 w-20 text-white/40" />
                    </div>
                  )}

                  {/* Face detected indicator */}
                  {faceDetection.detected && (
                    <div className="absolute -right-2 -top-2">
                      <div className="animate-pulse rounded-full bg-green-500 p-2">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status indicators */}
              <div className="absolute left-1/2 top-6 -translate-x-1/2 transform">
                <div
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium backdrop-blur-sm transition-all duration-300",
                    faceDetection.detected && faceDetection.confidence > 70
                      ? "bg-green-500/90 text-white"
                      : faceDetection.detected && faceDetection.confidence > 50
                        ? "bg-yellow-500/90 text-white"
                        : "bg-gray-900/80 text-gray-100"
                  )}
                >
                  {faceDetection.detected && faceDetection.confidence > 70
                    ? `Perfect! Hold still... (${Math.round(faceDetection.confidence)}%)`
                    : faceDetection.detected
                      ? `Face detected (${Math.round(faceDetection.confidence)}%)`
                      : "Position your face in the circle"}
                </div>
              </div>

              {/* Countdown overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <div className="text-center">
                    <div className="mb-4 animate-bounce text-8xl font-bold text-white">
                      {countdown}
                    </div>
                    <div className="text-lg text-white">Get ready!</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center text-white">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-white"></div>
                <p className="text-sm">Starting camera...</p>
                <p className="mt-2 text-xs text-gray-300">
                  {retryCount > 0 ? `Attempt ${retryCount + 1}/3` : "This may take a moment"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Auto-capture toggle */}
        <div className="flex items-center justify-center gap-3">
          <input
            type="checkbox"
            id="smartAutoCapture"
            checked={autoCapture}
            onChange={(e) => setAutoCapture(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="smartAutoCapture" className="text-sm font-medium text-gray-700">
            Smart auto-capture when face is perfectly aligned
          </label>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-3">
          <Button
            onClick={handleCapture}
            disabled={isCapturing || isLoading}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            {isCapturing ? (
              <>📸 Capturing...</>
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                Take Photo
              </>
            )}
          </Button>

          <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="lg">
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>

          <Button onClick={onCancel} variant="ghost" size="lg">
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>

        {/* Hidden file input */}
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
