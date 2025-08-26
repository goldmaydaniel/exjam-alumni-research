"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  QrCode,
  UserCheck,
  Users,
  Camera,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import jsQR from "jsqr";

interface ScanResult {
  success: boolean;
  message: string;
  attendee?: {
    id: string;
    name: string;
    email: string;
    profilePhoto?: string;
    ticketType: string;
    badgeType: string;
  };
  event?: {
    id: string;
    title: string;
  };
  scanStats?: {
    totalScans: number;
    scanType: string;
    location: string;
  };
}

interface RecentScan {
  id: string;
  badge: {
    display_name: string;
    badge_type: string;
    user: {
      firstName: string;
      lastName: string;
      profilePhoto?: string;
    };
  };
  scan_type: string;
  scan_location: string;
  scanned_at: string;
}

export default function CheckInPage() {
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [currentEvent, setCurrentEvent] = useState<any>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [scanStats, setScanStats] = useState<any>({});
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [scanLocation, setScanLocation] = useState("main_entrance");
  const [scanType, setScanType] = useState("checkin");
  const [loading, setLoading] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchRecentScans();
    setCurrentEvent({ id: "pg-conference-2025", title: "PG Conference 2025" });
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setScanning(true);

        scanIntervalRef.current = setInterval(scanForQRCode, 500);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Failed to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    setScanning(false);
  };

  const scanForQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !scanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context || video.videoWidth === 0 || video.videoHeight === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      handleQRCodeDetected(code.data);
    }
  };

  const handleQRCodeDetected = async (qrData: string) => {
    setScanning(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    await processQRCode(qrData);

    setTimeout(() => {
      if (streamRef.current) {
        setScanning(true);
        scanIntervalRef.current = setInterval(scanForQRCode, 500);
      }
    }, 3000);
  };

  const processQRCode = async (qrData: string) => {
    try {
      const response = await fetch("/api/checkin/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qr_code_data: qrData,
          scan_type: scanType,
          scan_location: scanLocation,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setLastScanResult({
          success: true,
          message: result.message,
          attendee: result.attendee,
          event: result.event,
          scanStats: result.scanStats,
        });
        toast.success(`✅ ${result.attendee.name} checked in successfully!`);
        fetchRecentScans();
      } else {
        setLastScanResult({
          success: false,
          message: result.error,
        });
        toast.error(`❌ ${result.error}`);
      }
    } catch (error) {
      console.error("Error processing QR code:", error);
      setLastScanResult({
        success: false,
        message: "Failed to process QR code",
      });
      toast.error("Failed to process QR code");
    }
  };

  const handleManualScan = async () => {
    if (!manualCode.trim()) {
      toast.error("Please enter a QR code");
      return;
    }

    await processQRCode(manualCode);
    setManualCode("");
  };

  const fetchRecentScans = async () => {
    try {
      setLoading(true);
      const eventId = currentEvent?.id || "pg-conference-2025";
      const response = await fetch(`/api/checkin/scan?eventId=${eventId}&limit=20`);
      const data = await response.json();

      if (response.ok) {
        setRecentScans(data.scans);
        setScanStats(data.statistics);
      }
    } catch (error) {
      console.error("Error fetching recent scans:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Event Check-In Scanner</h1>
        <p className="text-gray-600">Scan QR codes to check in attendees</p>
      </div>

      {/* Statistics */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserCheck className="mr-3 h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{scanStats.byType?.checkin || 0}</p>
                <p className="text-gray-600">Total Check-ins</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <QrCode className="mr-3 h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{scanStats.total || 0}</p>
                <p className="text-gray-600">Total Scans</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="mr-3 h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{scanStats.byLocation?.main_entrance || 0}</p>
                <p className="text-gray-600">Main Entrance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Scanner Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code Scanner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Scanner Controls */}
            <div className="mb-4 flex gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Scan Type</label>
                <select
                  value={scanType}
                  onChange={(e) => setScanType(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="checkin">Check In</option>
                  <option value="checkout">Check Out</option>
                  <option value="session_entry">Session Entry</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Location</label>
                <select
                  value={scanLocation}
                  onChange={(e) => setScanLocation(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="main_entrance">Main Entrance</option>
                  <option value="hall_a">Hall A</option>
                  <option value="hall_b">Hall B</option>
                  <option value="networking_area">Networking Area</option>
                </select>
              </div>
            </div>

            {/* Camera View */}
            <div className="relative">
              {!scanning ? (
                <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 p-8 text-center">
                  <Camera className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                  <p className="mb-4 text-gray-600">Click to start camera scanning</p>
                  <Button onClick={startCamera} className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Start Camera
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg"
                    style={{ maxHeight: "300px" }}
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute right-2 top-2">
                    <Button variant="outline" size="sm" onClick={stopCamera}>
                      Stop Camera
                    </Button>
                  </div>

                  <div className="pointer-events-none absolute inset-0 rounded-lg border-4 border-blue-500">
                    <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 transform rounded-lg border-2 border-white"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Manual QR Code Entry */}
            <div className="border-t pt-4">
              <label className="mb-2 block text-sm font-medium">Manual QR Code Entry</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter QR code data..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleManualScan()}
                />
                <Button onClick={handleManualScan} disabled={!manualCode.trim()}>
                  Scan
                </Button>
              </div>
            </div>

            {/* Last Scan Result */}
            {lastScanResult && (
              <div
                className={`rounded-lg p-4 ${
                  lastScanResult.success
                    ? "border border-green-200 bg-green-50"
                    : "border border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {lastScanResult.success ? (
                    <CheckCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-green-600" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-red-600" />
                  )}

                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        lastScanResult.success ? "text-green-900" : "text-red-900"
                      }`}
                    >
                      {lastScanResult.message}
                    </p>

                    {lastScanResult.attendee && (
                      <div className="mt-3 flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={lastScanResult.attendee.profilePhoto} />
                          <AvatarFallback>
                            {lastScanResult.attendee.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>

                        <div>
                          <p className="font-medium text-gray-900">
                            {lastScanResult.attendee.name}
                          </p>
                          <p className="text-sm text-gray-600">{lastScanResult.attendee.email}</p>
                          <div className="mt-1 flex gap-2">
                            <Badge variant="outline">{lastScanResult.attendee.ticketType}</Badge>
                            <Badge variant="secondary">{lastScanResult.attendee.badgeType}</Badge>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Scans */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Recent Check-ins
              </CardTitle>
              <Button variant="outline" size="sm" onClick={fetchRecentScans}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 space-y-4 overflow-y-auto">
              {recentScans.map((scan) => (
                <div key={scan.id} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={scan.badge.user.profilePhoto} />
                    <AvatarFallback>
                      {scan.badge.user.firstName[0]}
                      {scan.badge.user.lastName[0]}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <p className="font-medium">{scan.badge.display_name}</p>
                    <p className="text-sm text-gray-600">
                      {scan.scan_location} • {formatTime(scan.scanned_at)}
                    </p>
                  </div>

                  <div className="text-right">
                    <Badge variant={scan.scan_type === "checkin" ? "default" : "secondary"}>
                      {scan.scan_type}
                    </Badge>
                    <p className="mt-1 text-xs text-gray-500">{scan.badge.badge_type}</p>
                  </div>
                </div>
              ))}

              {recentScans.length === 0 && !loading && (
                <div className="py-8 text-center">
                  <UserCheck className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <p className="text-gray-600">No check-ins yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
