// app/api/auth/resend-verification/route.ts
//
// POST /api/auth/resend-verification  — resend the signup confirmation email.
// Body: { email: string }
//
// Enumeration-safe: always returns a generic success message.

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

    await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${appUrl}/api/auth/callback` },
    })

    return apiSuccess({
      message: 'If that account still needs verification, a new link is on its way.',
    })
  } catch (err) {
    console.error('[POST /api/auth/resend-verification]', err)
    return apiError('Internal server error', 500)
  }
}
