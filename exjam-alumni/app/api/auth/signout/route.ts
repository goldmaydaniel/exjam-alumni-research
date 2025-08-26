import { NextRequest, NextResponse } from 'next/server'
import { signOut } from '@/lib/auth/auth-complete'
import { withErrorHandling } from '@/lib/middleware/error-middleware'

/**
 * POST /api/auth/signout
 * Sign out current user
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  const result = await signOut()

  if (!result.success) {
    return NextResponse.json(
      { error: result.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    message: result.message
  })
})