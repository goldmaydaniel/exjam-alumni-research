"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuthStore } from "@/lib/store/consolidated-auth";
import {
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Reply,
  Trash,
  Archive,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "pending" | "read" | "replied";
  createdAt: string;
  updatedAt: string;
}

interface MessageStats {
  total: number;
  pending: number;
  read: number;
  replied: number;
}

export default function MessagesManagementPage() {
  const { token } = useAuthStore();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [stats, setStats] = useState<MessageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchMessages();
  }, [currentPage, filterStatus, searchTerm]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(filterStatus !== "all" && { status: filterStatus }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/admin/messages?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch messages");

      const data = await response.json();
      setMessages(data.messages);
      setStats(data.stats);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      toast.error("Failed to load messages");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewMessage = async (message: ContactMessage) => {
    setSelectedMessage(message);

    // Mark as read if pending
    if (message.status === "pending") {
      try {
        await fetch(`/api/admin/messages/${message.id}/read`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        fetchMessages();
      } catch (error) {
        console.error("Failed to mark message as read");
      }
    }
  };

  const handleReply = async () => {
    if (!selectedMessage) return;

    try {
      const response = await fetch(`/api/admin/messages/${selectedMessage.id}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: replyMessage }),
      });

      if (!response.ok) throw new Error("Failed to send reply");

      toast.success("Reply sent successfully");
      setIsReplyDialogOpen(false);
      setReplyMessage("");
      fetchMessages();
    } catch (error) {
      toast.error("Failed to send reply");
      console.error(error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      const response = await fetch(`/api/admin/messages/${messageId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete message");

      toast.success("Message deleted successfully");
      fetchMessages();
    } catch (error) {
      toast.error("Failed to delete message");
      console.error(error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-500", icon: Clock },
      read: { color: "bg-blue-500", icon: CheckCircle },
      replied: { color: "bg-green-500", icon: Reply },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || AlertCircle;

    return (
      <Badge className={`${config?.color || "bg-gray-500"} text-white`}>
        <Icon className="mr-1 h-3 w-3" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Contact Messages</h1>
        <p className="text-muted-foreground">Manage and respond to user inquiries</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Read</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.read}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Replied</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.replied}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                onClick={() => setFilterStatus("all")}
              >
                All
              </Button>
              <Button
                variant={filterStatus === "pending" ? "default" : "outline"}
                onClick={() => setFilterStatus("pending")}
              >
                Pending
              </Button>
              <Button
                variant={filterStatus === "read" ? "default" : "outline"}
                onClick={() => setFilterStatus("read")}
              >
                Read
              </Button>
              <Button
                variant={filterStatus === "replied" ? "default" : "outline"}
                onClick={() => setFilterStatus("replied")}
              >
                Replied
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    Loading messages...
                  </TableCell>
                </TableRow>
              ) : messages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    No messages found
                  </TableCell>
                </TableRow>
              ) : (
                messages.map((message) => (
                  <TableRow
                    key={message.id}
                    className={
                      message.status === "pending" ? "bg-yellow-50 dark:bg-yellow-950/20" : ""
                    }
                  >
                    <TableCell>{getStatusBadge(message.status)}</TableCell>
                    <TableCell>{new Date(message.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{message.name}</TableCell>
                    <TableCell>{message.email}</TableCell>
                    <TableCell className="max-w-xs truncate">{message.subject}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewMessage(message)}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMessage(message);
                            setIsReplyDialogOpen(true);
                          }}
                        >
                          <Reply className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteMessage(message.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t px-4 py-4">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Message Dialog */}
      {selectedMessage && !isReplyDialogOpen && (
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Message Details</DialogTitle>
              <DialogDescription>
                From: {selectedMessage.name} ({selectedMessage.email})
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Subject</p>
                <p className="font-medium">{selectedMessage.subject}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Message</p>
                <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Received: {new Date(selectedMessage.createdAt).toLocaleString()}</span>
                <span>Status: {getStatusBadge(selectedMessage.status)}</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedMessage(null)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setIsReplyDialogOpen(true);
                }}
              >
                <Reply className="mr-2 h-4 w-4" />
                Reply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Message</DialogTitle>
            <DialogDescription>Send a reply to {selectedMessage?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Original Message</p>
              <p className="text-sm">{selectedMessage?.message}</p>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">Your Reply</p>
              <Textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply here..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReplyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReply}>
              <Mail className="mr-2 h-4 w-4" />
              Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
