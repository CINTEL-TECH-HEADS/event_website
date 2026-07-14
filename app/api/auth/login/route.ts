// app/api/auth/login/route.ts
//
// POST /api/auth/login  — SINGLE login for both organizers and participants.
// Body: { email: string, password: string }
//
// Authenticates only — it never creates accounts.
//   - New participants create an account via /signup.
//   - Organizers are created manually by an admin.
//
// Flow:
//   1. Rate-limit by IP.
//   2. Sign in with email + password.
//   3. Determine role (superadmin / organizer / participant).
//   4. Return a role-based redirect.

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createSessionClient, createAdminClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

function isEmailNotConfirmed(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return error.code === 'email_not_confirmed' || /email not confirmed/i.test(error.message ?? '')
}

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limit
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    if (!rateLimit('login', ip).success) {
      return apiError('Too many attempts. Please wait a few minutes and try again.', 429)
    }

    const body = await req.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 400)

    const email = parsed.data.email.toLowerCase()
    const { password } = parsed.data

    const supabase = await createSessionClient()
    const admin = createAdminClient()

    // 2. Sign in
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password })

    if (!signInData?.user) {
      // Account exists but the email hasn't been verified
      if (isEmailNotConfirmed(signInError)) {
        return apiSuccess({
          needsVerification: true,
          email,
          message: 'Please verify your email — we sent a confirmation link to your inbox.',
        })
      }
      return apiError('Invalid email or password. New here? Create an account with Sign up.', 401)
    }

    const userId = signInData.user.id

    // 3. Determine role — superadmin/organizer or event_organizers membership → organizer
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    const { data: orgRows } = await admin
      .from('event_organizers')
      .select('id')
      .eq('profile_id', userId)
      .limit(1)

    const isOrganizer =
      profile?.role === 'superadmin' ||
      profile?.role === 'organizer' ||
      (orgRows?.length ?? 0) > 0

    // 4. Link any of this email's registrations to the account (participant convenience)
    await admin
      .from('registrations')
      .update({ participant_id: userId })
      .eq('leader_email', email)
      .is('participant_id', null)

    return apiSuccess({
      redirect: isOrganizer ? '/dashboard' : '/participant/portal',
      role: isOrganizer ? 'organizer' : 'participant',
    })
  } catch (err) {
    console.error('[POST /api/auth/login]', err)
    return apiError('Internal server error', 500)
  }
}
