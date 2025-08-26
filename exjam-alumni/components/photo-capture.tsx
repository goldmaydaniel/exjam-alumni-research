"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, Upload, X, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";

interface PhotoCaptureProps {
  onPhotoCapture: (photo: File | null) => void;
  existingPhotoUrl?: string;
  className?: string;
}

export default function PhotoCapture({
  onPhotoCapture,
  existingPhotoUrl,
  className = "",
}: PhotoCaptureProps) {
  const [mode, setMode] = useState<"capture" | "upload" | "preview">("capture");
  const [photoUrl, setPhotoUrl] = useState<string>(existingPhotoUrl || "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setError("");
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsCapturing(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please check permissions or use upload instead.");
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsCapturing(false);
    }
  }, [stream]);

  // Capture photo from camera
  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        context.drawImage(video, 0, 0);

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
              setPhotoFile(file);
              setPhotoUrl(URL.createObjectURL(blob));
              setMode("preview");
              stopCamera();
              onPhotoCapture(file);
            }
          },
          "image/jpeg",
          0.95
        );
      }
    }
  }, [stopCamera, onPhotoCapture]);

  // Handle file upload
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          setError("Please upload an image file");
          return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          setError("Image size must be less than 5MB");
          return;
        }

        setPhotoFile(file);
        setPhotoUrl(URL.createObjectURL(file));
        setMode("preview");
        onPhotoCapture(file);
      }
    },
    [onPhotoCapture]
  );

  // Reset photo
  const resetPhoto = useCallback(() => {
    setPhotoUrl("");
    setPhotoFile(null);
    setMode("capture");
    setError("");
    onPhotoCapture(null);
    stopCamera();
  }, [onPhotoCapture, stopCamera]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Mode selection */}
      {!photoUrl && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === "capture" ? "default" : "outline"}
            onClick={() => {
              setMode("capture");
              startCamera();
            }}
            className="flex-1"
          >
            <Camera className="mr-2 h-4 w-4" />
            Take Photo
          </Button>
          <Button
            type="button"
            variant={mode === "upload" ? "default" : "outline"}
            onClick={() => {
              setMode("upload");
              stopCamera();
              fileInputRef.current?.click();
            }}
            className="flex-1"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Photo
          </Button>
        </div>
      )}

      {/* Error message */}
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {/* Camera view */}
      {mode === "capture" && isCapturing && (
        <Card className="relative overflow-hidden">
          <video ref={videoRef} autoPlay playsInline muted className="h-64 w-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            <Button
              type="button"
              onClick={capturePhoto}
              size="lg"
              className="rounded-full bg-white text-black hover:bg-gray-100"
            >
              <Camera className="h-6 w-6" />
            </Button>
            <Button
              type="button"
              onClick={stopCamera}
              variant="secondary"
              size="lg"
              className="rounded-full"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </Card>
      )}

      {/* Starting camera message */}
      {mode === "capture" && !isCapturing && !error && (
        <Card className="flex h-64 items-center justify-center">
          <div className="text-center">
            <Camera className="mx-auto mb-2 h-12 w-12 text-gray-400" />
            <p className="text-sm text-gray-500">Starting camera...</p>
          </div>
        </Card>
      )}

      {/* Preview */}
      {mode === "preview" && photoUrl && (
        <Card className="relative overflow-hidden">
          <div className="relative h-64 w-full">
            <Image src={photoUrl} alt="Captured photo" fill className="object-cover" />
          </div>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            <Button
              type="button"
              onClick={resetPhoto}
              variant="secondary"
              size="sm"
              className="rounded-full bg-white/90 backdrop-blur"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Retake
            </Button>
            <Button
              type="button"
              size="sm"
              className="rounded-full bg-green-600 hover:bg-green-700"
              disabled
            >
              <Check className="mr-2 h-4 w-4" />
              Photo Captured
            </Button>
          </div>
        </Card>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}
