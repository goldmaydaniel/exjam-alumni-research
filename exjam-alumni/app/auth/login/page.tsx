'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react'
import { signIn } from '@/lib/auth/auth-complete'
import { createClientSupabaseClient } from '@/lib/auth/auth-complete'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect')
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClientSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // User is already logged in, redirect to appropriate dashboard
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const { user } = await response.json()
          const dashboardUrls: Record<string, string> = {
            'ADMIN': '/dashboard/super-admin',
            'ORGANIZER': '/dashboard/admin', 
            'SPEAKER': '/dashboard/speaker',
            'VERIFIED_MEMBER': '/dashboard/member',
            'ATTENDEE': '/dashboard/member',
            'GUEST_MEMBER': '/dashboard/guest'
          }
          router.replace(dashboardUrls[user.role] || '/dashboard/guest')
        }
      }
    }
    
    checkAuth()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear errors when user starts typing
    if (error) setError('')
    if (success) setSuccess('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await signIn(formData.email, formData.password)
      
      if (result.success) {
        setSuccess(result.message)
        
        // Redirect to intended page or dashboard
        const targetUrl = redirectUrl || result.redirectUrl || '/dashboard'
        
        // Small delay to show success message
        setTimeout(() => {
          router.push(targetUrl)
        }, 1000)
      } else {
        setError(result.message)
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError('Please enter your email address first')
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClientSupabaseClient()
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })
      
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Password reset link sent to your email')
      }
    } catch (error) {
      setError('Failed to send password reset email')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your ExJAM Alumni account
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-lg" onSubmit={handleSubmit}>
          {/* Status Messages */}
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-lg">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          
          {success && (
            <div className="flex items-center gap-2 p-3 text-sm text-green-700 bg-green-100 border border-green-300 rounded-lg">
              <CheckCircle size={16} />
              {success}
            </div>
          )}

          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-blue-600 hover:text-blue-500"
              disabled={isLoading}
            >
              Forgot your password?
            </button>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading || !formData.email || !formData.password}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link 
              href="/auth/signup" 
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign up here
            </Link>
          </div>

          {/* Demo Accounts */}
          <div className="border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500 text-center mb-2">Demo Accounts:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center p-2 bg-gray-50 rounded">
                <p className="font-medium">Admin</p>
                <p>admin@exjam.org</p>
                <p>admin123</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <p className="font-medium">Member</p>
                <p>member@exjam.org</p>
                <p>member123</p>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>© 2024 ExJAM Alumni Association</p>
        </div>
      </div>
    </div>
  )
}