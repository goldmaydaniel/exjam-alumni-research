'use client'

import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Calendar, 
  CreditCard, 
  Activity, 
  Settings, 
  Database, 
  Shield, 
  AlertTriangle,
  TrendingUp,
  Eye,
  UserCheck,
  MessageSquare,
  BarChart3,
  Server,
  FileText,
  Mail,
  Bell
} from 'lucide-react'
import { User } from '@/lib/auth/auth-complete'

interface DashboardStats {
  users: {
    total: number
    active: number
    newThisMonth: number
    byRole: { role: string; count: number }[]
  }
  events: {
    total: number
    published: number
    upcoming: number
    registrations: number
  }
  payments: {
    totalRevenue: number
    thisMonth: number
    pending: number
    successful: number
  }
  system: {
    healthScore: number
    uptime: number
    activeConnections: number
    errorRate: number
  }
}

interface Props {
  user: User
}

export default function SuperAdminDashboard({ user }: Props) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      setLoading(true)
      
      // Load various dashboard data in parallel
      const [usersRes, eventsRes, paymentsRes, systemRes] = await Promise.all([
        fetch('/api/admin/users/stats'),
        fetch('/api/admin/events/stats'),
        fetch('/api/admin/payments/stats'),
        fetch('/api/admin/monitoring?type=system')
      ])

      const [usersData, eventsData, paymentsData, systemData] = await Promise.all([
        usersRes.json(),
        eventsRes.json(),
        paymentsRes.json(),
        systemRes.json()
      ])

      setStats({
        users: usersData,
        events: eventsData,
        payments: paymentsData,
        system: systemData.metrics
      })
    } catch (error) {
      console.error('Failed to load dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'events', label: 'Event Management', icon: Calendar },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'system', label: 'System Health', icon: Server },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
              <p className="text-sm text-gray-600">
                Welcome back, {user.firstName} {user.lastName}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* System Health Indicator */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-100">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">
                  System Healthy
                </span>
              </div>
              
              {/* User Profile */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user.firstName[0]}{user.lastName[0]}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700">Super Admin</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-white shadow-sm h-screen sticky top-0">
          <div className="p-4">
            <div className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === 'overview' && (
            <OverviewTab stats={stats} />
          )}
          
          {activeTab === 'users' && (
            <UserManagementTab />
          )}
          
          {activeTab === 'events' && (
            <EventManagementTab />
          )}
          
          {activeTab === 'payments' && (
            <PaymentManagementTab />
          )}
          
          {activeTab === 'system' && (
            <SystemHealthTab stats={stats?.system} />
          )}
          
          {activeTab === 'security' && (
            <SecurityTab />
          )}
          
          {activeTab === 'settings' && (
            <SettingsTab />
          )}
        </main>
      </div>
    </div>
  )
}

// Overview Tab Component
function OverviewTab({ stats }: { stats: DashboardStats | null }) {
  if (!stats) return <div>Loading...</div>

  const statCards = [
    {
      title: 'Total Users',
      value: stats.users.total.toLocaleString(),
      change: `+${stats.users.newThisMonth} this month`,
      color: 'blue',
      icon: Users
    },
    {
      title: 'Active Events',
      value: stats.events.upcoming.toString(),
      change: `${stats.events.published} published`,
      color: 'green',
      icon: Calendar
    },
    {
      title: 'Total Revenue',
      value: `₦${stats.payments.totalRevenue.toLocaleString()}`,
      change: `₦${stats.payments.thisMonth.toLocaleString()} this month`,
      color: 'purple',
      icon: CreditCard
    },
    {
      title: 'System Health',
      value: `${stats.system.healthScore}%`,
      change: `${stats.system.uptime.toFixed(1)}h uptime`,
      color: 'emerald',
      icon: Activity
    }
  ]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.title} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
              </div>
              <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <TrendingUp size={48} className="mx-auto mb-2 opacity-50" />
              <p>User growth chart would be displayed here</p>
            </div>
          </div>
        </div>

        {/* Event Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Events</span>
              <span className="font-semibold">{stats.events.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Published Events</span>
              <span className="font-semibold">{stats.events.published}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Registrations</span>
              <span className="font-semibold">{stats.events.registrations}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <UserCheck className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium">New user registered</p>
              <p className="text-xs text-gray-500">John Doe joined the platform</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <Calendar className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium">Event published</p>
              <p className="text-xs text-gray-500">Annual Reunion event is now live</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
            <CreditCard className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium">Payment received</p>
              <p className="text-xs text-gray-500">₦25,000 payment for conference registration</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Placeholder components for other tabs
function UserManagementTab() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">User Management</h2>
      <p className="text-gray-600">User management interface would be implemented here.</p>
    </div>
  )
}

function EventManagementTab() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Management</h2>
      <p className="text-gray-600">Event management interface would be implemented here.</p>
    </div>
  )
}

function PaymentManagementTab() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Management</h2>
      <p className="text-gray-600">Payment management interface would be implemented here.</p>
    </div>
  )
}

function SystemHealthTab({ stats }: { stats?: any }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">System Health Monitoring</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="font-medium text-green-700">Database</span>
            </div>
            <p className="text-sm text-green-600 mt-1">Connected and healthy</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="font-medium text-blue-700">Cache</span>
            </div>
            <p className="text-sm text-blue-600 mt-1">Redis operational</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="font-medium text-purple-700">API</span>
            </div>
            <p className="text-sm text-purple-600 mt-1">All endpoints responding</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SecurityTab() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Security Center</h2>
      <p className="text-gray-600">Security monitoring and configuration would be implemented here.</p>
    </div>
  )
}

function SettingsTab() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">System Settings</h2>
      <p className="text-gray-600">System configuration settings would be implemented here.</p>
    </div>
  )
}