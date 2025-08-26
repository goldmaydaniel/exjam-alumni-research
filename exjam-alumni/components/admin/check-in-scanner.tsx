"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Camera,
  CameraOff,
  CheckCircle,
  XCircle,
  Search,
  User,
  Calendar,
  CreditCard,
  MapPin,
} from "lucide-react";

interface CheckInResult {
  success: boolean;
  registration?: {
    id: string;
    ticket_id: string;
    user: {
      first_name: string;
      last_name: string;
      email: string;
    };
    event: {
      title: string;
      event_date: string;
    };
    payment_status: string;
    checked_in: boolean;
    checked_in_at?: string;
  };
  message?: string;
  checkInTime?: string;
  error?: string;
}

export default function CheckInScanner() {
  const [activeTab, setActiveTab] = useState("qr");
  const [scanning, setScanning] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [location, setLocation] = useState("Main Entrance");
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Camera functionality (simplified - would need QR code library in production)
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScanning(true);
      }
    } catch (error) {
      console.error("Error starting camera:", error);
      setResult({
        success: false,
        error: "Unable to access camera. Please check permissions.",
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  const handleManualCheckIn = async () => {
    if (!ticketId.trim()) {
      setResult({
        success: false,
        error: "Please enter a ticket ID",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/checkin/qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketId: ticketId.trim(),
          location,
        }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        setTicketId(""); // Clear form on success
      }
    } catch (error) {
      setResult({
        success: false,
        error: "Network error. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = async (qrData: string) => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/checkin/qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          qrData,
          location,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: "Network error. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const lookupRegistration = async () => {
    if (!ticketId.trim()) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/checkin/qr?ticketId=${encodeURIComponent(ticketId)}`);
      const data = await response.json();

      if (response.ok) {
        setResult({
          success: false, // Not checked in yet, just showing info
          registration: data,
        });
      } else {
        setResult({
          success: false,
          error: data.error || "Registration not found",
        });
      }
    } catch (error) {
      setResult({
        success: false,
        error: "Network error. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera(); // Cleanup on unmount
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Event Check-In</h2>
        <div className="flex items-center gap-2">
          <Label htmlFor="location">Location:</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-40"
            placeholder="Check-in location"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="qr">QR Code Scanner</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="qr" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                QR Code Scanner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative flex aspect-video items-center justify-center rounded-lg bg-gray-100">
                {scanning ? (
                  <div className="relative h-full w-full">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="h-full w-full rounded-lg object-cover"
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute left-0 top-0 h-full w-full"
                      style={{ display: "none" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-48 w-48 rounded-lg border-2 border-dashed border-white"></div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <Camera className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                    <p className="text-gray-600">Click start to begin scanning</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {!scanning ? (
                  <Button onClick={startCamera} className="flex-1">
                    <Camera className="mr-2 h-4 w-4" />
                    Start Scanner
                  </Button>
                ) : (
                  <Button onClick={stopCamera} variant="destructive" className="flex-1">
                    <CameraOff className="mr-2 h-4 w-4" />
                    Stop Scanner
                  </Button>
                )}
              </div>

              <Alert>
                <AlertDescription>
                  Position the QR code from the participant's badge within the scanner frame. The
                  system will automatically detect and process the code.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Manual Check-In
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ticketId">Ticket ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="ticketId"
                    value={ticketId}
                    onChange={(e) => setTicketId(e.target.value)}
                    placeholder="Enter ticket ID (e.g., EXJAM2025-12345)"
                    className="flex-1"
                    onKeyDown={(e) => e.key === "Enter" && lookupRegistration()}
                  />
                  <Button onClick={lookupRegistration} variant="outline" disabled={loading}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleManualCheckIn}
                  disabled={loading || !ticketId.trim()}
                  className="flex-1"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Check In
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Results Display */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Check-In Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.error ? (
              <Alert>
                <AlertDescription>{result.error}</AlertDescription>
              </Alert>
            ) : result.registration ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">
                        {result.registration.user.first_name} {result.registration.user.last_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-gray-500" />
                      <span>Ticket: {result.registration.ticket_id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>{result.registration.event.title}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          result.registration.payment_status === "paid" ? "default" : "secondary"
                        }
                      >
                        {result.registration.payment_status}
                      </Badge>
                    </div>
                    {result.registration.checked_in && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          Checked in:{" "}
                          {new Date(result.registration.checked_in_at!).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {result.success ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Successfully checked in at {location}
                      {result.checkInTime && ` on ${new Date(result.checkInTime).toLocaleString()}`}
                    </AlertDescription>
                  </Alert>
                ) : result.message ? (
                  <Alert>
                    <AlertDescription>{result.message}</AlertDescription>
                  </Alert>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600">Processing...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
