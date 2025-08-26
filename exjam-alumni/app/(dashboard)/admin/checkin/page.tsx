"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb, useBreadcrumbs } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Camera,
  Search,
  CheckCircle,
  XCircle,
  Users,
  Loader2,
  QrCode,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import jsQR from "jsqr";
import { BrowserMultiFormatReader } from "@zxing/library";
import { useAuthStore } from "@/lib/store/consolidated-auth";

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
  const pathname = usePathname();
  const { token } = useAuthStore();
  const breadcrumbItems = useBreadcrumbs(pathname);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [currentEvent, setCurrentEvent] = useState<any>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, checkedIn: 0 });
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [checkInResult, setCheckInResult] = useState<any>(null);
  const [scanLocation, setScanLocation] = useState("main_entrance");
  const [scanType, setScanType] = useState("checkin");
  const [loading, setLoading] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    fetchRecentCheckins();
    fetchStats();

    return () => {
      stopScanning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRecentCheckins = async () => {
    try {
      const response = await fetch("/api/checkin", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setRecentScans(data.slice(0, 5));
      }
    } catch (error) {
      console.error("Failed to fetch recent check-ins:", error);
    }
  };

  const fetchStats = async () => {
    // This would fetch from an analytics endpoint
    // For now, using mock data
    setStats({ total: 150, checkedIn: 45 });
  };

  const startScanning = async () => {
    try {
      setScanning(true);
      setCheckInResult(null);

      if (!codeReader.current) {
        codeReader.current = new BrowserMultiFormatReader();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        codeReader.current.decodeFromVideoElement(videoRef.current, (result) => {
          if (result) {
            const text = result.getText();
            handleQRCode(text);
            stopScanning();
          }
        });
      }
    } catch (error) {
      console.error("Camera error:", error);
      toast.error("Failed to access camera");
      setScanning(false);
    }
  };

  const stopScanning = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    codeReader.current = null;
    setScanning(false);
  };

  const handleQRCode = async (data: string) => {
    try {
      // Parse QR code data
      const qrData = JSON.parse(data);
      await performCheckIn(qrData.t || data);
    } catch {
      // If not JSON, treat as ticket number
      await performCheckIn(data);
    }
  };

  const performCheckIn = async (ticketNumber: string) => {
    setLoading(true);
    setCheckInResult(null);

    try {
      const response = await fetch("/api/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ticketNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        setCheckInResult(data);

        if (data.success) {
          toast.success("Check-in successful!");
        } else if (data.warning) {
          toast.error(data.warning);
        }

        fetchRecentCheckins();
        fetchStats();
      } else {
        setCheckInResult({ error: data.error });
        toast.error(data.error || "Check-in failed");
      }
    } catch (error) {
      console.error("Check-in error:", error);
      setCheckInResult({ error: "Failed to process check-in" });
      toast.error("Failed to process check-in");
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheckIn = async () => {
    if (!manualInput.trim()) {
      toast.error("Please enter a ticket number");
      return;
    }

    await performCheckIn(manualInput.trim());
    setManualInput("");
  };

  return (
    <div className="container py-8">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={breadcrumbItems} className="mb-6" />

      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Event Check-In</h1>
        <p className="text-muted-foreground">
          Scan QR codes or enter ticket numbers to check in attendees
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checked In</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.checkedIn}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total - stats.checkedIn}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Scanner Section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>QR Code Scanner</CardTitle>
              <CardDescription>Scan attendee QR codes for quick check-in</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scanning ? (
                  <div className="relative">
                    <video
                      ref={videoRef}
                      className="aspect-square w-full rounded-lg bg-black"
                      autoPlay
                      playsInline
                    />
                    <Button
                      onClick={stopScanning}
                      variant="secondary"
                      className="absolute bottom-4 left-1/2 -translate-x-1/2"
                    >
                      Stop Scanning
                    </Button>
                  </div>
                ) : (
                  <div className="flex aspect-square items-center justify-center rounded-lg bg-muted">
                    <Button onClick={startScanning} size="lg">
                      <Camera className="mr-2 h-5 w-5" />
                      Start Scanner
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Manual Input */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Manual Check-In</CardTitle>
              <CardDescription>Enter ticket number manually</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter ticket number"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleManualCheckIn()}
                />
                <Button onClick={handleManualCheckIn} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div>
          {/* Check-in Result */}
          {checkInResult && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>
                  {checkInResult.success
                    ? "✅ Check-In Successful"
                    : checkInResult.warning
                      ? "⚠️ Already Checked In"
                      : "❌ Check-In Failed"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {checkInResult.ticket && (
                  <div className="space-y-2">
                    <p className="text-lg font-semibold">
                      {checkInResult.ticket.user.firstName} {checkInResult.ticket.user.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {checkInResult.ticket.user.email}
                    </p>
                    <div className="space-y-1 pt-2">
                      <p className="text-sm">
                        <span className="font-medium">Event:</span>{" "}
                        {checkInResult.ticket.event.title}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Ticket Type:</span>{" "}
                        {checkInResult.ticket.registration.ticketType}
                      </p>
                      {checkInResult.warning && checkInResult.ticket.checkedInAt && (
                        <Alert>
                          <AlertDescription>
                            Already checked in at{" "}
                            {new Date(checkInResult.ticket.checkedInAt).toLocaleString()}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                )}
                {checkInResult.error && (
                  <Alert variant="destructive">
                    <AlertDescription>{checkInResult.error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Check-ins */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Check-Ins</CardTitle>
              <CardDescription>Latest attendee check-ins</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentScans.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No check-ins yet</p>
                ) : (
                  recentScans.map((checkin) => (
                    <div
                      key={checkin.id}
                      className="flex items-center justify-between border-b py-2 last:border-0"
                    >
                      <div>
                        <p className="font-medium">
                          {checkin.user.firstName} {checkin.user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(checkin.checkedInAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
