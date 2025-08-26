import { NextRequest, NextResponse } from 'next/server'
import { signUp } from '@/lib/auth/auth-complete'
import { withErrorHandling, withValidation } from '@/lib/middleware/error-middleware'
import { userRegistrationSchema } from '@/lib/validation/validators'
import { withCompleteSecurity } from '@/lib/security/security-middleware'

/**
 * POST /api/auth/signup
 * Register a new user account
 */
export const POST = withCompleteSecurity(
  { enableRateLimit: true },
  withValidation(
    userRegistrationSchema,
    async (req: NextRequest, validatedData) => {
      const result = await signUp({
        email: validatedData.email,
        password: validatedData.password,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        graduationYear: validatedData.graduationYear?.toString(),
        squadron: validatedData.squadron,
        phoneNumber: validatedData.phoneNumber
      })

      if (!result.success) {
        return NextResponse.json(
          { error: result.message },
          { status: 400 }
        )
      }

      return NextResponse.json({
        message: result.message,
        userId: result.userId
      }, { status: 201 })
    }
  )
)