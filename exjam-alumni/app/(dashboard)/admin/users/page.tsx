"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Search,
  Filter,
  Download,
  MoreVertical,
  UserPlus,
  Mail,
  Shield,
  Ban,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Edit,
  Trash2,
  Key,
  Send,
  Users,
  UserCheck,
  UserX,
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  fullName: string;
  firstName: string;
  lastName: string;
  serviceNumber?: string;
  squadron?: string;
  phone?: string;
  role: string;
  status: "ACTIVE" | "SUSPENDED" | "DELETED";
  createdAt: string;
  lastLogin?: string;
  registrations?: number;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");

  // Dialog states
  const [editDialog, setEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [bulkActionDialog, setBulkActionDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState("");

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    suspended: 0,
    verified: 0,
    admins: 0,
  });

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch users");

      const data = await response.json();
      setUsers(data.users);
      setStats(data.stats);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error("Failed to update user");

      toast.success("User updated successfully");
      fetchUsers();
      setEditDialog(false);
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    }
  };

  const handleSuspendUser = async (userId: string) => {
    if (!confirm("Are you sure you want to suspend this user?")) return;

    await handleUpdateUser(userId, { status: "SUSPENDED" });
  };

  const handleActivateUser = async (userId: string) => {
    await handleUpdateUser(userId, { status: "ACTIVE" });
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone."))
      return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete user");

      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  const handleBulkAction = async () => {
    if (selectedUsers.length === 0) {
      toast.error("No users selected");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/users/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userIds: selectedUsers,
          action: bulkAction,
        }),
      });

      if (!response.ok) throw new Error("Bulk action failed");

      toast.success(`Bulk action completed for ${selectedUsers.length} users`);
      setSelectedUsers([]);
      setBulkActionDialog(false);
      fetchUsers();
    } catch (error) {
      console.error("Error performing bulk action:", error);
      toast.error("Bulk action failed");
    }
  };

  const handleSendEmail = async (userId: string) => {
    // Open email compose dialog
    toast.success("Email compose feature coming soon");
  };

  const handleResetPassword = async (userId: string) => {
    if (!confirm("Send password reset email to this user?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to send reset email");

      toast.success("Password reset email sent");
    } catch (error) {
      console.error("Error sending reset email:", error);
      toast.error("Failed to send reset email");
    }
  };

  const exportUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/export?type=users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Users exported successfully");
    } catch (error) {
      console.error("Error exporting users:", error);
      toast.error("Failed to export users");
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.serviceNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && user.status === "ACTIVE") ||
      (activeTab === "suspended" && user.status === "SUSPENDED") ||
      (activeTab === "unverified" && !user.emailVerified);

    return matchesSearch && matchesTab;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Badge className="bg-red-100 text-red-800">Admin</Badge>;
      case "ORGANIZER":
        return <Badge className="bg-blue-100 text-blue-800">Organizer</Badge>;
      case "VERIFIED_MEMBER":
        return <Badge>Verified Member</Badge>;
      case "GUEST_MEMBER":
        return <Badge>Guest Member</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string, emailVerified: boolean) => {
    if (status === "SUSPENDED") {
      return <Badge variant="destructive">Suspended</Badge>;
    }
    if (!emailVerified) {
      return <Badge variant="secondary">Unverified</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">Active</Badge>;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage all registered users and their permissions</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Suspended</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.suspended}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.verified}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.admins}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-8"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="ORGANIZER">Organizer</SelectItem>
                  <SelectItem value="VERIFIED_MEMBER">Verified Member</SelectItem>
                  <SelectItem value="GUEST_MEMBER">Guest Member</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              {selectedUsers.length > 0 && (
                <Button variant="outline" onClick={() => setBulkActionDialog(true)}>
                  Bulk Actions ({selectedUsers.length})
                </Button>
              )}
              <Button variant="outline" onClick={exportUsers}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Users Table */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader>
            <TabsList>
              <TabsTrigger value="all">All Users</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="suspended">Suspended</TabsTrigger>
              <TabsTrigger value="unverified">Unverified</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No users found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUsers.length === filteredUsers.length}
                        onCheckedChange={(checked: boolean) => {
                          if (checked) {
                            setSelectedUsers(filteredUsers.map((u) => u.id));
                          } else {
                            setSelectedUsers([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Squadron</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={(checked: boolean) => {
                            if (checked) {
                              setSelectedUsers([...selectedUsers, user.id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter((id) => id !== user.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.fullName}</p>
                          <p className="text-sm text-muted-foreground">{user.serviceNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{user.email}</p>
                          <p className="text-sm text-muted-foreground">{user.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.squadron && <Badge variant="outline">{user.squadron}</Badge>}
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getStatusBadge(user.status, user.emailVerified)}</TableCell>
                      <TableCell>
                        <p className="text-sm">{format(new Date(user.createdAt), "MMM d, yyyy")}</p>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setEditDialog(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSendEmail(user.id)}>
                              <Mail className="mr-2 h-4 w-4" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetPassword(user.id)}>
                              <Key className="mr-2 h-4 w-4" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.status === "ACTIVE" ? (
                              <DropdownMenuItem
                                className="text-yellow-600"
                                onClick={() => handleSuspendUser(user.id)}
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                Suspend User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="text-green-600"
                                onClick={() => handleActivateUser(user.id)}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Activate User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Tabs>
      </Card>

      {/* Edit User Dialog */}
      {selectedUser && (
        <Dialog open={editDialog} onOpenChange={setEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Update user information and permissions</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={selectedUser.fullName}
                  onChange={(e) => setSelectedUser({ ...selectedUser, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={selectedUser.role}
                  onValueChange={(value) => setSelectedUser({ ...selectedUser, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VERIFIED_MEMBER">Verified Member</SelectItem>
                    <SelectItem value="GUEST_MEMBER">Guest Member</SelectItem>
                    <SelectItem value="ORGANIZER">Organizer</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={selectedUser.status}
                  onValueChange={(value: any) =>
                    setSelectedUser({ ...selectedUser, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  handleUpdateUser(selectedUser.id, {
                    fullName: selectedUser.fullName,
                    role: selectedUser.role,
                    status: selectedUser.status,
                  })
                }
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Bulk Actions Dialog */}
      <Dialog open={bulkActionDialog} onOpenChange={setBulkActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Actions</DialogTitle>
            <DialogDescription>
              Apply action to {selectedUsers.length} selected users
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={bulkAction} onValueChange={setBulkAction}>
              <SelectTrigger>
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activate">Activate Users</SelectItem>
                <SelectItem value="suspend">Suspend Users</SelectItem>
                <SelectItem value="delete">Delete Users</SelectItem>
                <SelectItem value="email">Send Email</SelectItem>
                <SelectItem value="export">Export Selected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkActionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkAction} disabled={!bulkAction}>
              Apply Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
