"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  MapPin,
  Download,
  QrCode,
  MoreVertical,
  Eye,
  XCircle,
  FileText,
  Mail,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

interface Registration {
  id: string;
  ticketType: string;
  status: string;
  createdAt: string;
  arrivalDate?: string;
  departureDate?: string;
  event: {
    id: string;
    title: string;
    startDate: string;
    endDate?: string;
    venue: string;
    address?: string;
    imageUrl?: string;
    description?: string;
  };
  payment?: {
    amount: number;
    status: string;
    currency?: string;
    reference?: string;
    paidAt?: string;
  };
  ticket?: {
    ticketNumber: string;
    qrCode: string;
    checkedIn?: boolean;
    checkedInAt?: string;
  };
}

interface RegistrationCardProps {
  registration: Registration;
  onCancel?: (registrationId: string) => void;
  onViewTicket?: (registration: Registration) => void;
  onDownloadTicket?: (registration: Registration) => void;
}

export default function RegistrationCard({
  registration,
  onCancel,
  onViewTicket,
  onDownloadTicket,
}: RegistrationCardProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showTicketDialog, setShowTicketDialog] = useState(false);

  const eventDate = new Date(registration.event.startDate);
  const isPastEvent = eventDate < new Date();
  const isUpcoming = !isPastEvent;

  const getStatusBadge = () => {
    const status = registration.status.toUpperCase();
    switch (status) {
      case "CONFIRMED":
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      case "CHECKED_IN":
        return <Badge className="bg-blue-100 text-blue-800">Checked In</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPaymentStatusIcon = () => {
    if (!registration.payment) return null;

    switch (registration.payment.status) {
      case "SUCCESS":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "FAILED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleCancelRegistration = async () => {
    setCancelling(true);
    try {
      const response = await fetch(`/api/registrations/${registration.id}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to cancel registration");

      toast.success("Registration cancelled successfully");
      setShowCancelDialog(false);
      if (onCancel) onCancel(registration.id);
    } catch (error) {
      toast.error("Failed to cancel registration");
    } finally {
      setCancelling(false);
    }
  };

  const handleDownloadTicket = async () => {
    if (!registration.ticket) {
      toast.error("No ticket available");
      return;
    }

    try {
      // Create a downloadable PDF or image of the ticket
      const response = await fetch(`/api/tickets/${registration.ticket.ticketNumber}/download`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to download ticket");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ticket-${registration.ticket.ticketNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Ticket downloaded successfully");
    } catch (error) {
      // Fallback: Download QR code as image
      const a = document.createElement("a");
      a.href = registration.ticket.qrCode;
      a.download = `ticket-${registration.ticket.ticketNumber}.png`;
      a.click();
      toast.success("QR code downloaded");
    }
  };

  const handleResendConfirmation = async () => {
    try {
      const response = await fetch(`/api/registrations/${registration.id}/resend-confirmation`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to resend confirmation");

      toast.success("Confirmation email sent");
    } catch (error) {
      toast.error("Failed to resend confirmation email");
    }
  };

  return (
    <>
      <Card className="transition-shadow duration-200 hover:shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="line-clamp-1 text-lg font-semibold">{registration.event.title}</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(eventDate, "MMM d, yyyy")}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {registration.event.venue}
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {registration.ticket && (
                  <>
                    <DropdownMenuItem onClick={() => setShowTicketDialog(true)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Ticket
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDownloadTicket}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Ticket
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={handleResendConfirmation}>
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Confirmation
                </DropdownMenuItem>
                {registration.payment && (
                  <DropdownMenuItem>
                    <FileText className="mr-2 h-4 w-4" />
                    View Receipt
                  </DropdownMenuItem>
                )}
                {isUpcoming && registration.status !== "CANCELLED" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => setShowCancelDialog(true)}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel Registration
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {registration.event.imageUrl && (
            <img
              src={registration.event.imageUrl}
              alt={registration.event.title}
              className="h-40 w-full rounded-md object-cover"
            />
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Registration Status</p>
              {getStatusBadge()}
            </div>
            {registration.ticket && (
              <div className="space-y-1 text-right">
                <p className="text-sm text-muted-foreground">Ticket</p>
                <p className="font-mono text-sm">{registration.ticket.ticketNumber}</p>
              </div>
            )}
          </div>

          {registration.payment && (
            <div className="flex items-center justify-between border-t pt-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {registration.payment.currency || "₦"}
                  {registration.payment.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {getPaymentStatusIcon()}
                <span className="text-sm capitalize">{registration.payment.status}</span>
              </div>
            </div>
          )}

          {registration.ticket?.checkedIn && (
            <div className="flex items-center gap-2 border-t pt-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>
                Checked in{" "}
                {registration.ticket.checkedInAt &&
                  `on ${format(new Date(registration.ticket.checkedInAt), "MMM d, yyyy 'at' h:mm a")}`}
              </span>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-4">
          <div className="flex w-full gap-2">
            {registration.ticket && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowTicketDialog(true)}
              >
                <QrCode className="mr-2 h-4 w-4" />
                View Ticket
              </Button>
            )}
            {!registration.ticket && registration.status === "PENDING" && (
              <Button variant="outline" size="sm" className="flex-1">
                Complete Payment
              </Button>
            )}
            {isPastEvent && (
              <Button variant="ghost" size="sm" className="flex-1">
                <FileText className="mr-2 h-4 w-4" />
                Certificate
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Cancel Registration Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Registration</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your registration for {registration.event.title}? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Registration
            </Button>
            <Button variant="destructive" onClick={handleCancelRegistration} disabled={cancelling}>
              {cancelling ? "Cancelling..." : "Cancel Registration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket View Dialog */}
      {registration.ticket && (
        <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Event Ticket</DialogTitle>
              <DialogDescription>{registration.event.title}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-center">
                <img src={registration.ticket.qrCode} alt="Ticket QR Code" className="h-64 w-64" />
              </div>
              <div className="space-y-2 text-center">
                <p className="font-mono text-lg font-semibold">
                  {registration.ticket.ticketNumber}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(eventDate, "EEEE, MMMM d, yyyy")}
                </p>
                <p className="text-sm">{registration.event.venue}</p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleDownloadTicket}>
                <Download className="mr-2 h-4 w-4" />
                Download Ticket
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
