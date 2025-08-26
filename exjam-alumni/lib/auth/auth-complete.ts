/**
 * Complete Authentication System with RLS Support
 * Handles all authentication flows, role management, and database security
 */

import { createServerClient } from '@supabase/ssr'
import { createBrowserClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db/prisma'
import { logger } from '@/lib/logging/logger'
import { createError } from '@/lib/errors/api-errors'
import type { UserRole, UserStatus, Squadron } from '@prisma/client'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName?: string
  role: UserRole
  status: UserStatus
  squadron?: Squadron
  graduationYear?: string
  profilePhoto?: string
  emailVerified: boolean
  createdAt: Date
  lastLogin?: Date
}

export interface AuthSession {
  user: User
  supabaseUser: any
  accessToken: string
  refreshToken: string
  expiresAt: number
}

// Role hierarchy for permission checking
const ROLE_HIERARCHY: Record<UserRole, number> = {
  'GUEST_MEMBER': 1,
  'VERIFIED_MEMBER': 2,
  'ATTENDEE': 2,
  'SPEAKER': 3,
  'ORGANIZER': 4,
  'ADMIN': 5
}

// Dashboard routes for each role
const ROLE_DASHBOARDS: Record<UserRole, string> = {
  'GUEST_MEMBER': '/dashboard/guest',
  'VERIFIED_MEMBER': '/dashboard/member',
  'ATTENDEE': '/dashboard/member',
  'SPEAKER': '/dashboard/speaker',
  'ORGANIZER': '/dashboard/admin',
  'ADMIN': '/dashboard/super-admin'
}

/**
 * Create Supabase client for server-side operations
 */
export function createServerSupabaseClient() {
  const cookieStore = cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

/**
 * Create Supabase client for client-side operations
 */
export function createClientSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<AuthSession | null> {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !supabaseUser) {
      return null
    }

    // Get user from our database with role information
    const user = await db.user.findUnique({
      where: { id: supabaseUser.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        fullName: true,
        role: true,
        status: true,
        squadron: true,
        graduationYear: true,
        profilePhoto: true,
        emailVerified: true,
        createdAt: true,
        lastLogin: true
      }
    })

    if (!user) {
      logger.warn('User not found in database', { userId: supabaseUser.id })
      return null
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      logger.warn('User account not active', { userId: user.id, status: user.status })
      return null
    }

    // Get session info
    const { data: { session } } = await supabase.auth.getSession()

    return {
      user: user as User,
      supabaseUser,
      accessToken: session?.access_token || '',
      refreshToken: session?.refresh_token || '',
      expiresAt: session?.expires_at || 0
    }
  } catch (error) {
    logger.error('Failed to get current user', { error })
    return null
  }
}

/**
 * Require authentication - redirect if not authenticated
 */
export async function requireAuth(allowedRoles?: UserRole[]): Promise<AuthSession> {
  const session = await getCurrentUser()
  
  if (!session) {
    redirect('/auth/login')
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    redirect('/unauthorized')
  }

  // Update last login time
  await db.user.update({
    where: { id: session.user.id },
    data: { lastLogin: new Date() }
  }).catch(error => {
    logger.warn('Failed to update last login', { userId: session.user.id, error })
  })

  return session
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

/**
 * Check if user has permission for specific action
 */
export function hasPermission(user: User, permission: string): boolean {
  const rolePermissions: Record<UserRole, string[]> = {
    'GUEST_MEMBER': [
      'events.register',
      'profile.view_own',
      'profile.edit_own'
    ],
    'VERIFIED_MEMBER': [
      'events.register',
      'events.view_all',
      'profile.view_own',
      'profile.edit_own',
      'alumni.view_directory',
      'alumni.connect',
      'messages.send'
    ],
    'ATTENDEE': [
      'events.register',
      'events.view_all',
      'profile.view_own',
      'profile.edit_own',
      'alumni.view_directory'
    ],
    'SPEAKER': [
      'events.register',
      'events.view_all',
      'events.manage_own',
      'profile.view_own',
      'profile.edit_own',
      'alumni.view_directory',
      'messages.send'
    ],
    'ORGANIZER': [
      'events.create',
      'events.edit_all',
      'events.delete_own',
      'events.view_analytics',
      'users.view_list',
      'users.edit_roles',
      'registrations.manage',
      'payments.view',
      'messages.manage',
      'alumni.manage_directory'
    ],
    'ADMIN': [
      'system.full_access',
      'users.manage_all',
      'events.manage_all',
      'payments.manage_all',
      'settings.edit',
      'analytics.view_all',
      'audit.view_logs',
      'database.manage'
    ]
  }

  const userPermissions = rolePermissions[user.role] || []
  return userPermissions.includes(permission) || userPermissions.includes('system.full_access')
}

/**
 * Sign up new user
 */
export async function signUp(data: {
  email: string
  password: string
  firstName: string
  lastName: string
  graduationYear?: string
  squadron?: Squadron
  phoneNumber?: string
}): Promise<{ success: boolean; message: string; userId?: string }> {
  try {
    const supabase = createServerSupabaseClient()
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
        }
      }
    })

    if (authError) {
      logger.error('Supabase signup error', { error: authError })
      return { 
        success: false, 
        message: authError.message || 'Failed to create account'
      }
    }

    if (!authData.user) {
      return { success: false, message: 'Failed to create user account' }
    }

    // Create user record in our database
    const user = await db.user.create({
      data: {
        id: authData.user.id,
        email: data.email,
        password: '', // Not stored, handled by Supabase
        firstName: data.firstName,
        lastName: data.lastName,
        fullName: `${data.firstName} ${data.lastName}`,
        graduationYear: data.graduationYear,
        squadron: data.squadron,
        phone: data.phoneNumber,
        role: 'GUEST_MEMBER', // Default role
        status: 'ACTIVE',
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    logger.info('User registered successfully', {
      userId: user.id,
      email: user.email,
      role: user.role
    })

    return {
      success: true,
      message: 'Account created successfully. Please check your email for verification.',
      userId: user.id
    }
  } catch (error) {
    logger.error('Registration failed', { error, email: data.email })
    return {
      success: false,
      message: 'Registration failed. Please try again.'
    }
  }
}

/**
 * Sign in user
 */
export async function signIn(email: string, password: string): Promise<{
  success: boolean
  message: string
  redirectUrl?: string
}> {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      logger.warn('Sign in failed', { email, error: authError.message })
      return {
        success: false,
        message: authError.message || 'Invalid email or password'
      }
    }

    if (!authData.user) {
      return { success: false, message: 'Sign in failed' }
    }

    // Get user role for redirect
    const user = await db.user.findUnique({
      where: { id: authData.user.id },
      select: { role: true, status: true }
    })

    if (!user) {
      return { success: false, message: 'User account not found' }
    }

    if (user.status !== 'ACTIVE') {
      await supabase.auth.signOut()
      return { success: false, message: 'Account is suspended or inactive' }
    }

    // Update last login
    await db.user.update({
      where: { id: authData.user.id },
      data: { lastLogin: new Date() }
    })

    logger.info('User signed in successfully', {
      userId: authData.user.id,
      email: authData.user.email,
      role: user.role
    })

    return {
      success: true,
      message: 'Signed in successfully',
      redirectUrl: ROLE_DASHBOARDS[user.role]
    }
  } catch (error) {
    logger.error('Sign in error', { error, email })
    return {
      success: false,
      message: 'Sign in failed. Please try again.'
    }
  }
}

/**
 * Sign out user
 */
export async function signOut(): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = createServerSupabaseClient()
    
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      logger.error('Sign out error', { error })
      return { success: false, message: 'Failed to sign out' }
    }

    logger.info('User signed out successfully')
    
    return { success: true, message: 'Signed out successfully' }
  } catch (error) {
    logger.error('Sign out error', { error })
    return { success: false, message: 'Failed to sign out' }
  }
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(
  targetUserId: string,
  newRole: UserRole,
  adminUserId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Check admin permissions
    const admin = await db.user.findUnique({
      where: { id: adminUserId },
      select: { role: true, status: true }
    })

    if (!admin || !hasRole(admin.role, 'ORGANIZER')) {
      return { success: false, message: 'Insufficient permissions' }
    }

    // Prevent role escalation beyond admin's level
    if (ROLE_HIERARCHY[newRole] > ROLE_HIERARCHY[admin.role]) {
      return { success: false, message: 'Cannot assign role higher than your own' }
    }

    // Update user role
    await db.user.update({
      where: { id: targetUserId },
      data: { 
        role: newRole,
        updatedAt: new Date()
      }
    })

    // Log role change
    await db.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'UPDATE_USER_ROLE',
        entity: 'User',
        entityId: targetUserId,
        changes: { newRole, previousRole: 'unknown' },
        timestamp: new Date()
      }
    })

    logger.info('User role updated', {
      adminId: adminUserId,
      targetUserId,
      newRole
    })

    return { success: true, message: 'User role updated successfully' }
  } catch (error) {
    logger.error('Failed to update user role', { error, targetUserId, newRole })
    return { success: false, message: 'Failed to update user role' }
  }
}

/**
 * Get user dashboard URL based on role
 */
export function getDashboardUrl(role: UserRole): string {
  return ROLE_DASHBOARDS[role] || '/dashboard/guest'
}

/**
 * Middleware helper for API route protection
 */
export function withAuth(allowedRoles?: UserRole[]) {
  return async function (handler: Function) {
    return async function (req: any, ...args: any[]) {
      try {
        const session = await getCurrentUser()
        
        if (!session) {
          throw createError.unauthorized('Authentication required')
        }

        if (allowedRoles && !allowedRoles.includes(session.user.role)) {
          throw createError.forbidden('Insufficient permissions')
        }

        // Add user to request context
        req.user = session.user
        req.session = session
        
        return await handler(req, ...args)
      } catch (error) {
        throw error
      }
    }
  }
}

export {
  type UserRole,
  type UserStatus,
  type Squadron,
  ROLE_HIERARCHY,
  ROLE_DASHBOARDS
}