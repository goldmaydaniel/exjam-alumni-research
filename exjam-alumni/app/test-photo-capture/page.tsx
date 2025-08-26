"use client";

import { useState } from "react";
import { SmartPhotoCapture } from "@/components/smart-photo-capture";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

export default function TestPhotoCapture() {
  const [showCapture, setShowCapture] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const handleCapture = (imageData: string) => {
    setCapturedImage(imageData);
    setShowCapture(false);
    toast.success("Photo captured successfully! 🎉");
  };

  const handleCancel = () => {
    setShowCapture(false);
    toast.info("Photo capture cancelled");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-12 text-center">


          <h1 className="mb-4 text-4xl font-bold text-gray-900">Smart Photo Capture Test</h1>

          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            Test the new advanced face detection and photo capture system with React-only
            dependencies.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Capture Interface */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Camera className="h-5 w-5 text-blue-600" />
                Photo Capture
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {!showCapture && (
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100">
                    <Camera className="h-16 w-16 text-blue-400" />
                  </div>

                  <Button
                    onClick={() => setShowCapture(true)}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Start Smart Capture
                  </Button>

                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <strong>Features:</strong>
                    </p>
                    <ul className="space-y-1 text-xs">
                      <li>• Advanced face detection using skin tone analysis</li>
                      <li>• Edge detection for facial features</li>
                      <li>• Smart auto-capture when perfectly aligned</li>
                      <li>• Smooth detection with confidence scoring</li>
                      <li>• React-only implementation (no external libraries)</li>
                    </ul>
                  </div>
                </div>
              )}

              {showCapture && (
                <SmartPhotoCapture onCapture={handleCapture} onCancel={handleCancel} />
              )}
            </CardContent>
          </Card>

          {/* Results */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-green-600" />
                Captured Photo
              </CardTitle>
            </CardHeader>

            <CardContent>
              {capturedImage ? (
                <div className="space-y-4">
                  <div className="relative overflow-hidden rounded-2xl shadow-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={capturedImage} alt="Captured photo" className="w-full object-cover" />
                    <div className="absolute right-3 top-3 rounded-full bg-green-500 p-2">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                  </div>

                  <div className="space-y-2 text-center">
                    <p className="font-semibold text-green-600">Photo captured successfully!</p>
                    <p className="text-sm text-gray-600">
                      Face detection confidence and quality optimized
                    </p>

                    <Button
                      onClick={() => {
                        setCapturedImage(null);
                        setShowCapture(true);
                      }}
                      variant="outline"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Capture Another
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-12 text-center">
                  <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-2xl bg-gray-100">
                    <div className="text-gray-400">
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-gray-300">
                        <Camera className="h-6 w-6" />
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    No photo captured yet. <br />
                    Use the capture interface to test the new system.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Technical Details */}
        <Card className="mt-12 border-0 bg-gradient-to-r from-blue-50 to-purple-50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-center">Technical Improvements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 text-sm md:grid-cols-2">
              <div>
                <h4 className="mb-2 font-semibold text-gray-900">Enhanced Face Detection</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Multi-parameter skin tone detection (HSV + RGB)</li>
                  <li>• Sobel edge detection for facial features</li>
                  <li>• Brightness and contrast analysis</li>
                  <li>• Confidence scoring (0-100%)</li>
                  <li>• Smooth detection with history buffer</li>
                </ul>
              </div>

              <div>
                <h4 className="mb-2 font-semibold text-gray-900">User Experience</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Smart auto-capture when face is perfectly aligned</li>
                  <li>• Visual feedback with confidence indicators</li>
                  <li>• Countdown timer for manual capture</li>
                  <li>• Mirror effect for natural selfie experience</li>
                  <li>• Fallback upload option</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-12 text-center">
          <p className="mb-4 text-gray-600">Test this functionality in the registration forms:</p>
          <div className="flex justify-center gap-4">
            <Button asChild variant="outline">
              <a href="/register" target="_blank" rel="noopener noreferrer">
                Registration Form
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="/events" target="_blank" rel="noopener noreferrer">
                PG Conference Registration
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
