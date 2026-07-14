// app/api/auth/forgot-password/route.ts
//
// POST /api/auth/forgot-password  — send a Supabase password-reset email.
// Body: { email: string }
//
// Always returns success (never reveals whether an account exists).
// The email links back to /reset-password where the user sets a new password.

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createSessionClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const schema = z.object({ email: z.string().email('Invalid email') })

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    if (!rateLimit('password-reset', ip).success) {
      return apiError('Too many requests. Please wait a few minutes and try again.', 429)
    }

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 400)

    const email = parsed.data.email.toLowerCase()
    const supabase = await createSessionClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    // Fire and forget — ignore the result so we don't leak whether the email exists
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/reset-password`,
    })

    return apiSuccess({
      message: 'If an account exists for that email, a reset link is on its way.',
    })
  } catch (err) {
    console.error('[POST /api/auth/forgot-password]', err)
    return apiError('Internal server error', 500)
  }
}
