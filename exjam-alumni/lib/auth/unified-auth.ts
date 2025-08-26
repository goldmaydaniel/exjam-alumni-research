import { createClient } from '@/lib/supabase/server'
import { createClient as createClientClient } from '@/lib/supabase/client'
import { NextRequest, NextResponse } from 'next/server'
import { User } from '@supabase/supabase-js'
import { db, queries } from '@/lib/db/prisma'

export type UserRole = 'GUEST_MEMBER' | 'VERIFIED_MEMBER' | 'ATTENDEE' | 'SPEAKER' | 'ORGANIZER' | 'ADMIN'

export interface AuthUser extends User {
  role: UserRole
  squadron?: string
  graduationYear?: string
  serviceNumber?: string
}

export class AuthError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code: string = 'AUTH_ERROR'
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export async function getServerUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    // Get user metadata from User table using Prisma
    const userData = await db.user.findUnique({
      where: { id: user.id },
      select: {
        role: true,
        squadron: true,
        graduationYear: true,
        serviceNumber: true
      }
    }).catch(error => {
      console.warn('Failed to fetch user metadata:', error)
      return null
    })

    return {
      ...user,
      role: userData?.role || 'GUEST_MEMBER',
      squadron: userData?.squadron,
      graduationYear: userData?.graduationYear,
      serviceNumber: userData?.serviceNumber
    }
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

export async function getClientUser(): Promise<AuthUser | null> {
  try {
    const supabase = createClientClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    // For client-side, we'll make an API call to get user metadata
    // since Prisma client shouldn't be used on client side
    try {
      const response = await fetch('/api/auth/profile')
      const userData = await response.json()
      
      return {
        ...user,
        role: userData.role || 'GUEST_MEMBER',
        squadron: userData.squadron,
        graduationYear: userData.graduationYear,
        serviceNumber: userData.serviceNumber
      }
    } catch (fetchError) {
      console.warn('Failed to fetch user metadata:', fetchError)
      return {
        ...user,
        role: 'GUEST_MEMBER'
      }
    }
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

export async function requireAuth(req?: NextRequest, requiredRole?: UserRole): Promise<AuthUser> {
  const user = await getServerUser()

  if (!user) {
    throw new AuthError(401, 'Authentication required', 'UNAUTHORIZED')
  }

  if (requiredRole && !hasRole(user.role, requiredRole)) {
    throw new AuthError(403, 'Insufficient permissions', 'FORBIDDEN')
  }

  return user
}

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    'GUEST_MEMBER': 1,
    'VERIFIED_MEMBER': 2,
    'ATTENDEE': 3,
    'SPEAKER': 4,
    'ORGANIZER': 5,
    'ADMIN': 6
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === 'ADMIN'
}

export function isVerifiedMember(user: AuthUser | null): boolean {
  return user ? hasRole(user.role, 'VERIFIED_MEMBER') : false
}

export async function createAuthMiddleware(requiredRole?: UserRole) {
  return async function authMiddleware(req: NextRequest) {
    try {
      const user = await requireAuth(req, requiredRole)
      return { user }
    } catch (error) {
      if (error instanceof AuthError) {
        return NextResponse.json(
          { error: error.message, code: error.code },
          { status: error.statusCode }
        )
      }
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      )
    }
  }
}

export async function signIn(email: string, password: string) {
  const supabase = createClientClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    throw new AuthError(400, error.message, 'SIGN_IN_FAILED')
  }

  return data
}

export async function signUp(
  email: string, 
  password: string, 
  userData: {
    firstName: string
    lastName: string
    fullName?: string
    serviceNumber?: string
    squadron?: string
    graduationYear?: string
    phone?: string
    chapter?: string
    currentLocation?: string
    role?: UserRole
  }
) {
  const supabase = createClientClient()
  
  // Sign up with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        fullName: userData.fullName || `${userData.firstName} ${userData.lastName}`
      }
    }
  })

  if (authError) {
    throw new AuthError(400, authError.message, 'SIGN_UP_FAILED')
  }

  if (!authData.user) {
    throw new AuthError(400, 'Sign up failed', 'SIGN_UP_FAILED')
  }

  // Create user record in User table using Prisma
  try {
    await db.user.create({
      data: {
        id: authData.user.id,
        email,
        password: '', // Not stored since Supabase handles this
        firstName: userData.firstName,
        lastName: userData.lastName,
        fullName: userData.fullName || `${userData.firstName} ${userData.lastName}`,
        serviceNumber: userData.serviceNumber,
        squadron: userData.squadron as any,
        graduationYear: userData.graduationYear,
        phone: userData.phone,
        chapter: userData.chapter,
        currentLocation: userData.currentLocation,
        role: userData.role as any || 'GUEST_MEMBER',
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
  } catch (userError) {
    // Clean up auth user if User table insert fails
    await supabase.auth.admin.deleteUser(authData.user.id)
    throw new AuthError(500, 'Failed to create user profile', 'USER_CREATION_FAILED')
  }

  return authData
}

export async function signOut() {
  const supabase = createClientClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    throw new AuthError(500, error.message, 'SIGN_OUT_FAILED')
  }
}

export async function resetPassword(email: string) {
  const supabase = createClientClient()
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`
  })

  if (error) {
    throw new AuthError(400, error.message, 'RESET_PASSWORD_FAILED')
  }
}

export async function updatePassword(newPassword: string) {
  const supabase = createClientClient()
  
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })

  if (error) {
    throw new AuthError(400, error.message, 'UPDATE_PASSWORD_FAILED')
  }
}

export async function refreshSession() {
  const supabase = createClientClient()
  
  const { data, error } = await supabase.auth.refreshSession()
  
  if (error) {
    throw new AuthError(401, error.message, 'SESSION_REFRESH_FAILED')
  }
  
  return data
}