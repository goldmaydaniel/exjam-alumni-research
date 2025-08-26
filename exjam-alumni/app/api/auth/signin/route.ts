import { NextRequest, NextResponse } from 'next/server'
import { signIn } from '@/lib/auth/auth-complete'
import { withErrorHandling } from '@/lib/middleware/error-middleware'
import { withCompleteSecurity } from '@/lib/security/security-middleware'
import { z } from 'zod'

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

/**
 * POST /api/auth/signin
 * Sign in user with email and password
 */
export const POST = withCompleteSecurity(
  { enableRateLimit: true },
  withErrorHandling(async (req: NextRequest) => {
    const body = await req.json()
    const { email, password } = signInSchema.parse(body)

    const result = await signIn(email, password)

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 401 }
      )
    }

    return NextResponse.json({
      message: result.message,
      redirectUrl: result.redirectUrl
    })
  })
)