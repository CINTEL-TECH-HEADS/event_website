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
import { createSessionClient } from '@/lib/supabase/server'
import { resolveUserAccess } from '@/lib/auth/get-session'
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

    // 2. Sign in
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password })

    if (!signInData?.user) {
      // Account exists but the email hasn't been verified. Outbound email is
      // disabled and the login page has no verify step, so an admin must confirm it.
      if (isEmailNotConfirmed(signInError)) {
        return apiError("This account's email hasn't been verified yet. Ask a Cintel admin to verify it, then sign in again.", 403)
      }
      return apiError('Invalid email or password. Participants: use Continue with Google instead.', 401)
    }

    const userId = signInData.user.id

    // 3. Determine role/home (shared with layout gates + /api/auth/me)
    const access = await resolveUserAccess(userId, email)

    // 4. Password login is for organizers/superadmins only — participants must
    // use Google sign-in. Reject and fully sign out any participant-role account.
    if (!access.isOrganizer) {
      await supabase.auth.signOut()
      return apiError('Participants must sign in with Google.', 403)
    }

    return apiSuccess({
      redirect: access.home,
      role: 'organizer',
    })
  } catch (err) {
    console.error('[POST /api/auth/login]', err)
    return apiError('Internal server error', 500)
  }
}
