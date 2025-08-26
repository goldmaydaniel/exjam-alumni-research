import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/auth-complete'
import { withErrorHandling } from '@/lib/middleware/error-middleware'
import { createError } from '@/lib/errors/api-errors'

/**
 * GET /api/auth/me
 * Get current authenticated user information
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  const session = await getCurrentUser()
  
  if (!session) {
    throw createError.unauthorized('Authentication required')
  }

  return NextResponse.json({
    user: {
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      fullName: session.user.fullName,
      role: session.user.role,
      status: session.user.status,
      squadron: session.user.squadron,
      graduationYear: session.user.graduationYear,
      profilePhoto: session.user.profilePhoto,
      emailVerified: session.user.emailVerified,
      createdAt: session.user.createdAt,
      lastLogin: session.user.lastLogin
    },
    session: {
      expiresAt: session.expiresAt
    }
  })
})