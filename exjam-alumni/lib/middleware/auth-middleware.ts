import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, UserRole, AuthError } from '@/lib/auth/unified-auth'

export function withAuth(requiredRole?: UserRole) {
  return function (handler: (req: NextRequest, user: any) => Promise<NextResponse>) {
    return async function (req: NextRequest) {
      try {
        const user = await requireAuth(req, requiredRole)
        return await handler(req, user)
      } catch (error) {
        if (error instanceof AuthError) {
          return NextResponse.json(
            { error: error.message, code: error.code },
            { status: error.statusCode }
          )
        }
        
        console.error('Auth middleware error:', error)
        return NextResponse.json(
          { error: 'Authentication failed' },
          { status: 500 }
        )
      }
    }
  }
}

export function withOptionalAuth() {
  return function (handler: (req: NextRequest, user: any | null) => Promise<NextResponse>) {
    return async function (req: NextRequest) {
      try {
        const user = await requireAuth(req).catch(() => null)
        return await handler(req, user)
      } catch (error) {
        console.error('Optional auth middleware error:', error)
        return await handler(req, null)
      }
    }
  }
}

export const withAdminAuth = withAuth('ADMIN')
export const withMemberAuth = withAuth('VERIFIED_MEMBER')
export const withGuestAuth = withAuth('GUEST_MEMBER')