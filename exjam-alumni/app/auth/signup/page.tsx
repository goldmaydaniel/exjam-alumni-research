'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, User, Phone, GraduationCap, Shield, AlertCircle, CheckCircle } from 'lucide-react'
import { signUp } from '@/lib/auth/auth-complete'
import type { Squadron } from '@prisma/client'

const squadrons: { value: Squadron; label: string }[] = [
  { value: 'GREEN', label: 'Green Squadron' },
  { value: 'RED', label: 'Red Squadron' },
  { value: 'PURPLE', label: 'Purple Squadron' },
  { value: 'YELLOW', label: 'Yellow Squadron' },
  { value: 'DORNIER', label: 'Dornier Squadron' },
  { value: 'PUMA', label: 'Puma Squadron' }
]

export default function SignUpPage() {
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    graduationYear: '',
    squadron: '' as Squadron | '',
    phoneNumber: '',
    termsAccepted: false
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear errors when user starts typing
    if (error) setError('')
    if (success) setSuccess('')
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.firstName.trim()) errors.firstName = 'First name is required'
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required'
    if (!formData.email.trim()) errors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email is invalid'
    
    if (!formData.password) errors.password = 'Password is required'
    else if (formData.password.length < 8) errors.password = 'Password must be at least 8 characters'
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(formData.password)) {
      errors.password = 'Password must contain uppercase, lowercase, number, and special character'
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    
    if (formData.graduationYear && (parseInt(formData.graduationYear) < 1980 || parseInt(formData.graduationYear) > new Date().getFullYear() + 10)) {
      errors.graduationYear = 'Please enter a valid graduation year'
    }
    
    if (formData.phoneNumber && !/^\+?[\d\s\-\(\)\.]{10,}$/.test(formData.phoneNumber)) {
      errors.phoneNumber = 'Please enter a valid phone number'
    }
    
    if (!formData.termsAccepted) errors.termsAccepted = 'You must accept the terms and conditions'

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await signUp({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        graduationYear: formData.graduationYear || undefined,
        squadron: formData.squadron || undefined,
        phoneNumber: formData.phoneNumber || undefined
      })
      
      if (result.success) {
        setSuccess(result.message)
        
        // Redirect to login after successful signup
        setTimeout(() => {
          router.push('/auth/login?message=account-created')
        }, 3000)
      } else {
        setError(result.message)
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Signup error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const currentYear = new Date().getFullYear()
  const graduationYears = Array.from({ length: 50 }, (_, i) => currentYear + 5 - i)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Join ExJAM Alumni
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Connect with fellow Nigerian Air Force Academy alumni
          </p>
        </div>

        {/* Signup Form */}
        <form className="bg-white rounded-xl shadow-lg p-8 space-y-6" onSubmit={handleSubmit}>
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

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.firstName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your first name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                />
              </div>
              {validationErrors.firstName && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.lastName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your last name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                />
              </div>
              {validationErrors.lastName && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.lastName}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
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
                className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            {validationErrors.email && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.email}</p>
            )}
          </div>

          {/* Password Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className={`block w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Create a strong password"
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
              {validationErrors.password && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className={`block w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* Academy Information */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Academy Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Graduation Year */}
              <div>
                <label htmlFor="graduationYear" className="block text-sm font-medium text-gray-700 mb-1">
                  Graduation Year
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <GraduationCap className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="graduationYear"
                    name="graduationYear"
                    className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors.graduationYear ? 'border-red-300' : 'border-gray-300'
                    }`}
                    value={formData.graduationYear}
                    onChange={handleInputChange}
                  >
                    <option value="">Select year</option>
                    {graduationYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                {validationErrors.graduationYear && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.graduationYear}</p>
                )}
              </div>

              {/* Squadron */}
              <div>
                <label htmlFor="squadron" className="block text-sm font-medium text-gray-700 mb-1">
                  Squadron
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="squadron"
                    name="squadron"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.squadron}
                    onChange={handleInputChange}
                  >
                    <option value="">Select squadron</option>
                    {squadrons.map(squadron => (
                      <option key={squadron.value} value={squadron.value}>
                        {squadron.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your phone number"
                value={formData.phoneNumber}
                onChange={handleInputChange}
              />
            </div>
            {validationErrors.phoneNumber && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.phoneNumber}</p>
            )}
          </div>

          {/* Terms and Conditions */}
          <div>
            <div className="flex items-start">
              <input
                id="termsAccepted"
                name="termsAccepted"
                type="checkbox"
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={formData.termsAccepted}
                onChange={handleInputChange}
              />
              <label htmlFor="termsAccepted" className="ml-2 block text-sm text-gray-700">
                I agree to the{' '}
                <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {validationErrors.termsAccepted && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.termsAccepted}</p>
            )}
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </div>

          {/* Login Link */}
          <div className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link 
              href="/auth/login" 
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in here
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}