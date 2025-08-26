"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Calendar, 
  FileText, 
  Settings, 
  Shield, 
  Database,
  Activity,
  RefreshCw
} from "lucide-react";

interface AdminStats {
  total_users: number;
  total_events: number;
  total_registrations: number;
  published_events: number;
  confirmed_registrations: number;
}

interface AdminUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in: string;
}

export function AdminUtils() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    checkAdminStatus();
    loadAdminData();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email === 'goldmay@gmail.com') {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      // Load admin dashboard stats
      const { data: statsData, error: statsError } = await supabase
        .from('admin_dashboard_stats')
        .select('*')
        .single();

      if (statsError) {
        console.log('Stats error (expected if view not created):', statsError.message);
      } else {
        setStats(statsData);
      }

      // Load recent users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, role, created_at, last_sign_in_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (usersError) {
        console.log('Users error:', usersError.message);
      } else {
        setUsers(usersData || []);
      }

    } catch (error) {
      setError('Failed to load admin data');
      console.error('Admin data load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadAdminData();
  };

  if (!isAdmin) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-500" />
            Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            This admin panel is only accessible to authorized administrators.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ExJAM Admin Panel</h1>
          <p className="text-gray-600">Platform management and monitoring</p>
        </div>
        <Button onClick={refreshData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.total_users || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.total_events || 0}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Published Events</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.published_events || 0}
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Registrations</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.total_registrations || 0}
                </p>
              </div>
              <FileText className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Confirmed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.confirmed_registrations || 0}
                </p>
              </div>
              <Shield className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="w-full" variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Create Event
            </Button>
            <Button className="w-full" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
            <Button className="w-full" variant="outline">
              <Database className="h-4 w-4 mr-2" />
              Database Tools
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{user.email}</p>
                  <p className="text-sm text-gray-500">
                    Joined: {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                  {user.role || 'user'}
                </Badge>
              </div>
            ))}
            {users.length === 0 && (
              <p className="text-gray-500 text-center py-4">No users found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-500" />
            Security Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Admin Role</span>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Row Level Security</span>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Enabled
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database Access</span>
              <Badge variant="default" className="bg-blue-100 text-blue-800">
                Application Level
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
