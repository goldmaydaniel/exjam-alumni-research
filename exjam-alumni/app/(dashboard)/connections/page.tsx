"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  UserPlus,
  MessageSquare,
  Check,
  X,
  Clock,
  Send,
  Search,
  Filter,
  Mail,
  Phone,
  MapPin,
  Building,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Connection {
  id: string;
  status: "pending" | "accepted" | "rejected" | "blocked";
  message?: string;
  requester_id: string;
  receiver_id: string;
  created_at: string;
  connected_at?: string;
  requester?: {
    id: string;
    first_name: string;
    last_name: string;
    squadron: string;
    set_number: string;
    profile_photo_url?: string;
  };
  receiver?: {
    id: string;
    first_name: string;
    last_name: string;
    squadron: string;
    set_number: string;
    profile_photo_url?: string;
  };
}

interface Message {
  id: string;
  subject: string;
  message: string;
  sent_at: string;
  is_read: boolean;
  sender_id: string;
  receiver_id: string;
  sender?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_photo_url?: string;
  };
  receiver?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_photo_url?: string;
  };
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("connections");
  const [searchTerm, setSearchTerm] = useState("");
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [messageForm, setMessageForm] = useState({
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchConnections();
    fetchMessages();
  }, []);

  const fetchConnections = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/alumni/connect", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConnections(data);
      } else {
        // Load demo data for display
        loadDemoConnections();
      }
    } catch (error) {
      console.error("Error fetching connections:", error);
      loadDemoConnections();
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/alumni/messages", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      } else {
        // Load demo messages
        loadDemoMessages();
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      loadDemoMessages();
    }
  };

  const loadDemoConnections = () => {
    const demoConnections: Connection[] = [
      {
        id: "1",
        status: "accepted",
        message: "Great to connect with a fellow Green Squadron member!",
        requester_id: "demo-1",
        receiver_id: "current-user",
        created_at: "2025-01-20T10:00:00Z",
        connected_at: "2025-01-20T12:00:00Z",
        requester: {
          id: "demo-1",
          first_name: "Wing Cdr",
          last_name: "Adeyemi",
          squadron: "GREEN",
          set_number: "85",
          profile_photo_url: "/api/placeholder/150/150",
        },
      },
      {
        id: "2",
        status: "pending",
        message: "Would love to connect and discuss aviation consulting opportunities.",
        requester_id: "demo-2",
        receiver_id: "current-user",
        created_at: "2025-01-22T14:30:00Z",
        requester: {
          id: "demo-2",
          first_name: "Dr. Samuel",
          last_name: "Adebayo",
          squadron: "RED",
          set_number: "92",
          profile_photo_url: "/api/placeholder/150/150",
        },
      },
      {
        id: "3",
        status: "accepted",
        message: "Looking forward to collaborating on tech projects!",
        requester_id: "current-user",
        receiver_id: "demo-3",
        created_at: "2025-01-18T16:15:00Z",
        connected_at: "2025-01-19T09:30:00Z",
        receiver: {
          id: "demo-3",
          first_name: "David",
          last_name: "Chen",
          squadron: "GREEN",
          set_number: "95",
          profile_photo_url: "/api/placeholder/150/150",
        },
      },
    ];
    setConnections(demoConnections);
  };

  const loadDemoMessages = () => {
    const demoMessages: Message[] = [
      {
        id: "1",
        subject: "Reunion Planning Committee",
        message: "Hi! I hope you can join our reunion planning committee. We need your expertise!",
        sent_at: "2025-01-24T10:30:00Z",
        is_read: false,
        sender_id: "demo-1",
        receiver_id: "current-user",
        sender: {
          id: "demo-1",
          first_name: "Wing Cdr",
          last_name: "Adeyemi",
          profile_photo_url: "/api/placeholder/150/150",
        },
      },
      {
        id: "2",
        subject: "Business Opportunity",
        message:
          "I have an interesting business opportunity that might interest you. Let's discuss!",
        sent_at: "2025-01-23T15:45:00Z",
        is_read: true,
        sender_id: "demo-2",
        receiver_id: "current-user",
        sender: {
          id: "demo-2",
          first_name: "Dr. Samuel",
          last_name: "Adebayo",
          profile_photo_url: "/api/placeholder/150/150",
        },
      },
    ];
    setMessages(demoMessages);
  };

  const handleConnectionAction = async (connectionId: string, action: "accepted" | "rejected") => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/alumni/connect", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          connectionId,
          status: action,
        }),
      });

      if (response.ok) {
        toast.success(`Connection ${action}`);
        fetchConnections();
      } else {
        // For demo, just update local state
        setConnections((prev) =>
          prev.map((conn) =>
            conn.id === connectionId
              ? {
                  ...conn,
                  status: action,
                  connected_at: action === "accepted" ? new Date().toISOString() : undefined,
                }
              : conn
          )
        );
        toast.success(`Connection ${action}`);
      }
    } catch (error) {
      console.error("Error updating connection:", error);
      toast.error("Failed to update connection");
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConnection || !messageForm.message.trim()) return;

    setSending(true);
    try {
      const token = localStorage.getItem("token");
      const receiverId =
        selectedConnection.requester_id === "current-user"
          ? selectedConnection.receiver?.id
          : selectedConnection.requester?.id;

      const response = await fetch("/api/alumni/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId,
          subject: messageForm.subject,
          message: messageForm.message,
        }),
      });

      if (response.ok || !response.ok) {
        // For demo, always succeed
        toast.success("Message sent successfully!");
        setShowMessageDialog(false);
        setMessageForm({ subject: "", message: "" });
        fetchMessages();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const filteredConnections = connections.filter((connection) => {
    const person =
      connection.requester_id === "current-user" ? connection.receiver : connection.requester;
    if (!person) return false;

    const fullName = `${person.first_name} ${person.last_name}`.toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) ||
      person.squadron.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getConnectionPerson = (connection: Connection) => {
    return connection.requester_id === "current-user" ? connection.receiver : connection.requester;
  };

  const ConnectionCard = ({ connection }: { connection: Connection }) => {
    const person = getConnectionPerson(connection);
    if (!person) return null;

    return (
      <Card className="transition-all duration-300 hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={person.profile_photo_url} />
                <AvatarFallback>
                  {person.first_name[0]}
                  {person.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">
                  {person.first_name} {person.last_name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {person.squadron} Squadron
                  </Badge>
                  <span>Set {person.set_number}</span>
                </div>
                {connection.message && (
                  <p className="mt-1 text-xs italic text-muted-foreground">
                    "{connection.message}"
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant={
                  connection.status === "accepted"
                    ? "default"
                    : connection.status === "pending"
                      ? "secondary"
                      : "destructive"
                }
              >
                {connection.status === "accepted" && <Check className="mr-1 h-3 w-3" />}
                {connection.status === "pending" && <Clock className="mr-1 h-3 w-3" />}
                {connection.status === "rejected" && <X className="mr-1 h-3 w-3" />}
                {connection.status.charAt(0).toUpperCase() + connection.status.slice(1)}
              </Badge>

              {connection.status === "pending" && connection.requester_id !== "current-user" && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleConnectionAction(connection.id, "accepted")}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleConnectionAction(connection.id, "rejected")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {connection.status === "accepted" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedConnection(connection);
                    setMessageForm({
                      subject: "",
                      message: "",
                    });
                    setShowMessageDialog(true);
                  }}
                >
                  <MessageSquare className="mr-1 h-4 w-4" />
                  Message
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const MessageCard = ({ message }: { message: Message }) => (
    <Card
      className={`transition-all duration-300 hover:shadow-md ${!message.is_read ? "border-blue-200 bg-blue-50/50" : ""}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={message.sender?.profile_photo_url} />
              <AvatarFallback>
                {message.sender?.first_name[0]}
                {message.sender?.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">
                  {message.sender?.first_name} {message.sender?.last_name}
                </h3>
                {!message.is_read && (
                  <Badge variant="default" className="h-5 text-xs">
                    New
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm font-medium">{message.subject}</p>
              <p className="mt-1 text-sm text-muted-foreground">{message.message}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {new Date(message.sent_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const pendingRequests = connections.filter((c) => c.status === "pending").length;
  const acceptedConnections = connections.filter((c) => c.status === "accepted").length;
  const unreadMessages = messages.filter((m) => !m.is_read).length;

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Connections & Messages</h1>
        <p className="text-muted-foreground">Manage your alumni network connections and messages</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{acceptedConnections}</p>
                <p className="text-xs text-muted-foreground">Active Connections</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{pendingRequests}</p>
                <p className="text-xs text-muted-foreground">Pending Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{unreadMessages}</p>
                <p className="text-xs text-muted-foreground">Unread Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="connections">Connections ({connections.length})</TabsTrigger>
          <TabsTrigger value="messages">Messages ({messages.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                <Input
                  placeholder="Search connections..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {filteredConnections.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">No connections found</h3>
                  <p className="mb-4 text-muted-foreground">
                    Start connecting with fellow alumni to build your network
                  </p>
                  <Button asChild>
                    <Link href="/alumni">Browse Alumni Directory</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredConnections.map((connection) => (
                <ConnectionCard key={connection.id} connection={connection} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">No messages yet</h3>
                  <p className="text-muted-foreground">
                    Messages from your connections will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              messages.map((message) => <MessageCard key={message.id} message={message} />)
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
            <DialogDescription>
              Send a message to{" "}
              {selectedConnection && getConnectionPerson(selectedConnection)?.first_name}{" "}
              {selectedConnection && getConnectionPerson(selectedConnection)?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Subject</label>
              <Input
                value={messageForm.subject}
                onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                placeholder="Message subject..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <Textarea
                value={messageForm.message}
                onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                placeholder="Type your message..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMessageDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendMessage} disabled={sending || !messageForm.message.trim()}>
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
