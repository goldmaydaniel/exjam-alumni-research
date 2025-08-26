'use client'

import React, { useState, useEffect } from 'react'
import { 
  Calendar, 
  Users, 
  CreditCard, 
  Plus, 
  Edit, 
  Eye, 
  Trash2,
  Filter,
  Search,
  Download,
  BarChart3,
  MessageSquare,
  Settings,
  Bell,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp
} from 'lucide-react'
import { User } from '@/lib/auth/auth-complete'

interface Event {
  id: string
  title: string
  startDate: string
  endDate: string
  status: string
  registrationCount: number
  capacity: number
  venue: string
  price: number
}

interface Registration {
  id: string
  user: {
    firstName: string
    lastName: string
    email: string
  }
  event: {
    title: string
  }
  status: string
  createdAt: string
  ticketType: string
}

interface Props {
  user: User
}

export default function AdminDashboard({ user }: Props) {
  const [events, setEvents] = useState<Event[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      const [eventsRes, registrationsRes] = await Promise.all([
        fetch('/api/admin/events'),
        fetch('/api/admin/registrations')
      ])

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        setEvents(eventsData.events || [])
      }

      if (registrationsRes.ok) {
        const registrationsData = await registrationsRes.json()
        setRegistrations(registrationsData.registrations || [])
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'registrations', label: 'Registrations', icon: Users },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
  ]

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.venue.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || event.status === statusFilter
    return matchesSearch && matchesStatus
  })

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
              <h1 className="text-2xl font-bold text-gray-900">
                {user.role === 'ADMIN' ? 'Admin' : 'Organizer'} Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Welcome back, {user.firstName} {user.lastName}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Quick Actions */}
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus size={18} />
                Create Event
              </button>
              
              {/* Notifications */}
              <div className="relative">
                <button className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100">
                  <Bell size={20} />
                </button>
                <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></div>
              </div>
              
              {/* User Profile */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user.firstName[0]}{user.lastName[0]}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700">{user.role}</span>
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
            <OverviewTab events={events} registrations={registrations} />
          )}
          
          {activeTab === 'events' && (
            <EventsTab 
              events={filteredEvents}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
            />
          )}
          
          {activeTab === 'registrations' && (
            <RegistrationsTab registrations={registrations} />
          )}
          
          {activeTab === 'messages' && (
            <MessagesTab />
          )}
          
          {activeTab === 'analytics' && (
            <AnalyticsTab events={events} registrations={registrations} />
          )}
        </main>
      </div>
    </div>
  )
}

// Overview Tab Component
function OverviewTab({ events, registrations }: { events: Event[]; registrations: Registration[] }) {
  const stats = {
    totalEvents: events.length,
    publishedEvents: events.filter(e => e.status === 'PUBLISHED').length,
    upcomingEvents: events.filter(e => e.status === 'PUBLISHED' && new Date(e.startDate) > new Date()).length,
    totalRegistrations: registrations.length,
    confirmedRegistrations: registrations.filter(r => r.status === 'CONFIRMED').length,
    pendingRegistrations: registrations.filter(r => r.status === 'PENDING').length,
    totalRevenue: events.reduce((sum, event) => sum + (event.registrationCount * event.price), 0)
  }

  const statCards = [
    {
      title: 'Total Events',
      value: stats.totalEvents.toString(),
      change: `${stats.publishedEvents} published`,
      color: 'blue',
      icon: Calendar
    },
    {
      title: 'Total Registrations',
      value: stats.totalRegistrations.toString(),
      change: `${stats.confirmedRegistrations} confirmed`,
      color: 'green',
      icon: Users
    },
    {
      title: 'Pending Reviews',
      value: stats.pendingRegistrations.toString(),
      change: 'Need attention',
      color: 'yellow',
      icon: Clock
    },
    {
      title: 'Total Revenue',
      value: `₦${stats.totalRevenue.toLocaleString()}`,
      change: 'From all events',
      color: 'purple',
      icon: CreditCard
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

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
          <div className="space-y-3">
            {events
              .filter(e => e.status === 'PUBLISHED' && new Date(e.startDate) > new Date())
              .slice(0, 5)
              .map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{event.title}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(event.startDate).toLocaleDateString()} • {event.venue}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {event.registrationCount}/{event.capacity}
                    </p>
                    <p className="text-xs text-gray-500">registered</p>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Recent Registrations */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Registrations</h3>
          <div className="space-y-3">
            {registrations.slice(0, 5).map((registration) => (
              <div key={registration.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    {registration.user.firstName} {registration.user.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{registration.event.title}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    registration.status === 'CONFIRMED' 
                      ? 'bg-green-100 text-green-700'
                      : registration.status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {registration.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Events Tab Component
function EventsTab({ 
  events, 
  searchTerm, 
  setSearchTerm, 
  statusFilter, 
  setStatusFilter 
}: { 
  events: Event[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  statusFilter: string
  setStatusFilter: (status: string) => void
}) {
  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Event Management</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={18} />
          Create Event
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search events..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registrations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{event.title}</div>
                      <div className="text-sm text-gray-500">{event.venue}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(event.startDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      event.status === 'PUBLISHED' 
                        ? 'bg-green-100 text-green-700'
                        : event.status === 'DRAFT'
                        ? 'bg-gray-100 text-gray-700'
                        : event.status === 'CANCELLED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {event.registrationCount}/{event.capacity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye size={16} />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <Edit size={16} />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Placeholder components for other tabs
function RegistrationsTab({ registrations }: { registrations: Registration[] }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Registration Management</h2>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <p className="text-gray-600">Registration management interface would be implemented here.</p>
        <p className="text-sm text-gray-500 mt-2">Total registrations: {registrations.length}</p>
      </div>
    </div>
  )
}

function MessagesTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Messages & Communication</h2>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <p className="text-gray-600">Message management interface would be implemented here.</p>
      </div>
    </div>
  )
}

function AnalyticsTab({ events, registrations }: { events: Event[]; registrations: Registration[] }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Analytics & Reports</h2>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <p className="text-gray-600">Analytics dashboard would be implemented here.</p>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{events.length}</p>
            <p className="text-sm text-blue-600">Total Events</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{registrations.length}</p>
            <p className="text-sm text-green-600">Total Registrations</p>
          </div>
        </div>
      </div>
    </div>
  )
}