"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Shield,
  AlertTriangle,
  User,
  Calendar,
  MapPin,
  Briefcase,
} from "lucide-react";
import { format } from "date-fns";

interface MilitaryVerificationRecord {
  id: string;
  userId: string;
  serviceNumber: string;
  squadron: string;
  rank: string;
  serviceYearFrom: number;
  serviceYearTo: number | null;
  specialization?: string;
  baseLocation?: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: Date;
  verifiedAt?: Date | null;
  verificationNotes?: string;
  user: {
    name: string;
    email: string;
    createdAt: Date;
  };
  verifiedBy?: {
    name: string;
    email: string;
  } | null;
}

interface MilitaryVerificationDashboardProps {
  className?: string;
}

export const MilitaryVerificationDashboard: React.FC<MilitaryVerificationDashboardProps> = ({
  className,
}) => {
  const [records, setRecords] = useState<MilitaryVerificationRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MilitaryVerificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRecord, setSelectedRecord] = useState<MilitaryVerificationRecord | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Load verification records
  useEffect(() => {
    loadVerificationRecords();
  }, []);

  // Filter records based on search and status
  useEffect(() => {
    let filtered = records;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (record) =>
          record.serviceNumber.toLowerCase().includes(search) ||
          record.squadron.toLowerCase().includes(search) ||
          record.user.name.toLowerCase().includes(search) ||
          record.user.email.toLowerCase().includes(search) ||
          record.rank.toLowerCase().includes(search)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((record) => record.status === statusFilter);
    }

    setFilteredRecords(filtered);
  }, [records, searchTerm, statusFilter]);

  const loadVerificationRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/military-verifications");
      if (response.ok) {
        const data = await response.json();
        setRecords(data.records || []);
      }
    } catch (error) {
      console.error("Error loading verification records:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (recordId: string, status: "approved" | "rejected") => {
    if (!selectedRecord) return;

    try {
      setIsProcessing(true);
      const response = await fetch("/api/auth/verify-military", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedRecord.userId,
          status,
          notes: verificationNotes,
          verifiedBy: "current-admin-id", // This would come from session
        }),
      });

      if (response.ok) {
        await loadVerificationRecords(); // Refresh the list
        setSelectedRecord(null);
        setVerificationNotes("");
      }
    } catch (error) {
      console.error("Error processing verification:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="border-green-200 bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="border-red-200 bg-red-100 text-red-800">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      case "pending":
        return (
          <Badge className="border-yellow-200 bg-yellow-100 text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getUrgencyLevel = (submittedAt: Date) => {
    const daysSinceSubmission = Math.floor(
      (new Date().getTime() - new Date(submittedAt).getTime()) / (1000 * 3600 * 24)
    );

    if (daysSinceSubmission >= 7) return "high";
    if (daysSinceSubmission >= 3) return "medium";
    return "low";
  };

  const stats = React.useMemo(() => {
    const total = records.length;
    const pending = records.filter((r) => r.status === "pending").length;
    const approved = records.filter((r) => r.status === "approved").length;
    const rejected = records.filter((r) => r.status === "rejected").length;
    const urgent = records.filter(
      (r) => r.status === "pending" && getUrgencyLevel(r.submittedAt) === "high"
    ).length;

    return { total, pending, approved, rejected, urgent };
  }, [records]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Shield className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Urgent</p>
                <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col items-center gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="Search by service number, squadron, name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Military Verification Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading verification records...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Service Number</TableHead>
                    <TableHead>Squadron</TableHead>
                    <TableHead>Rank</TableHead>
                    <TableHead>Service Years</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => {
                    const urgency = getUrgencyLevel(record.submittedAt);
                    return (
                      <TableRow
                        key={record.id}
                        className={cn(
                          urgency === "high" &&
                            record.status === "pending" &&
                            "border-red-200 bg-red-50",
                          urgency === "medium" &&
                            record.status === "pending" &&
                            "border-yellow-200 bg-yellow-50"
                        )}
                      >
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{record.user.name}</div>
                            <div className="text-sm text-muted-foreground">{record.user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{record.serviceNumber}</TableCell>
                        <TableCell>{record.squadron}</TableCell>
                        <TableCell>{record.rank}</TableCell>
                        <TableCell>
                          {record.serviceYearFrom} - {record.serviceYearTo || "Present"}
                        </TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              {format(new Date(record.submittedAt), "MMM dd, yyyy")}
                            </div>
                            {urgency === "high" && record.status === "pending" && (
                              <Badge variant="destructive" className="text-xs">
                                Urgent
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedRecord(record)}
                              >
                                <Eye className="mr-1 h-4 w-4" />
                                Review
                              </Button>
                            </DialogTrigger>

                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Military Service Verification</DialogTitle>
                              </DialogHeader>

                              {selectedRecord && (
                                <div className="space-y-6">
                                  {/* Member Information */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">Member Name</Label>
                                      <p className="text-sm">{selectedRecord.user.name}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Email</Label>
                                      <p className="text-sm">{selectedRecord.user.email}</p>
                                    </div>
                                  </div>

                                  {/* Military Information */}
                                  <div className="space-y-4 border-t pt-4">
                                    <h3 className="font-medium">Military Service Details</h3>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-sm font-medium">
                                          Service Number
                                        </Label>
                                        <p className="font-mono">{selectedRecord.serviceNumber}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Squadron/Unit</Label>
                                        <p>{selectedRecord.squadron}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Rank</Label>
                                        <p>{selectedRecord.rank}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">
                                          Service Period
                                        </Label>
                                        <p>
                                          {selectedRecord.serviceYearFrom} -{" "}
                                          {selectedRecord.serviceYearTo || "Present"}
                                        </p>
                                      </div>
                                    </div>

                                    {(selectedRecord.specialization ||
                                      selectedRecord.baseLocation) && (
                                      <div className="grid grid-cols-2 gap-4">
                                        {selectedRecord.specialization && (
                                          <div>
                                            <Label className="text-sm font-medium">
                                              Specialization
                                            </Label>
                                            <p>{selectedRecord.specialization}</p>
                                          </div>
                                        )}
                                        {selectedRecord.baseLocation && (
                                          <div>
                                            <Label className="text-sm font-medium">
                                              Base Location
                                            </Label>
                                            <p>{selectedRecord.baseLocation}</p>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Verification Section */}
                                  {selectedRecord.status === "pending" && (
                                    <div className="space-y-4 border-t pt-4">
                                      <h3 className="font-medium">Verification Decision</h3>

                                      <div className="space-y-2">
                                        <Label htmlFor="verificationNotes">Notes (Optional)</Label>
                                        <Textarea
                                          id="verificationNotes"
                                          placeholder="Add any notes about this verification..."
                                          value={verificationNotes}
                                          onChange={(e) => setVerificationNotes(e.target.value)}
                                        />
                                      </div>

                                      <div className="flex gap-2">
                                        <Button
                                          onClick={() =>
                                            handleVerification(selectedRecord.id, "approved")
                                          }
                                          disabled={isProcessing}
                                          className="bg-green-600 hover:bg-green-700"
                                        >
                                          <CheckCircle className="mr-2 h-4 w-4" />
                                          Approve
                                        </Button>

                                        <Button
                                          variant="destructive"
                                          onClick={() =>
                                            handleVerification(selectedRecord.id, "rejected")
                                          }
                                          disabled={isProcessing}
                                        >
                                          <XCircle className="mr-2 h-4 w-4" />
                                          Reject
                                        </Button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Previous Verification Info */}
                                  {selectedRecord.status !== "pending" && (
                                    <div className="space-y-2 border-t pt-4">
                                      <h3 className="font-medium">Verification History</h3>
                                      <div className="text-sm text-muted-foreground">
                                        <p>Status: {getStatusBadge(selectedRecord.status)}</p>
                                        {selectedRecord.verifiedAt && (
                                          <p>
                                            Verified:{" "}
                                            {format(new Date(selectedRecord.verifiedAt), "PPP")}
                                          </p>
                                        )}
                                        {selectedRecord.verifiedBy && (
                                          <p>Verified by: {selectedRecord.verifiedBy.name}</p>
                                        )}
                                        {selectedRecord.verificationNotes && (
                                          <div className="mt-2">
                                            <p className="font-medium">Notes:</p>
                                            <p className="rounded bg-muted p-2">
                                              {selectedRecord.verificationNotes}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MilitaryVerificationDashboard;
