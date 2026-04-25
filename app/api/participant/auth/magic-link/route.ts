import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createSessionClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message)

    const { email, password } = parsed.data
    const supabase = await createSessionClient()
    const admin    = createAdminClient()

    // Step 1 — Try signing in first
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password })

    if (!signInError && signInData.user) {
      await linkRegistrations(email, signInData.user.id, admin)
      return apiSuccess({ message: 'Signed in', redirect: '/participant/portal' })
    }

    // Step 2 — Check if account exists
    const { data: listData } = await admin.auth.admin.listUsers()
    const existingUser = listData?.users?.find(
      u => u.email?.toLowerCase() === email.toLowerCase()
    )

    if (existingUser) {
      // Check if this email has registrations
      const { data: registrations } = await admin
        .from('registrations')
        .select('id')
        .eq('leader_email', email.toLowerCase())
        .limit(1)

      const { data: memberOf } = await admin
        .from('team_members')
        .select('id')
        .eq('email', email.toLowerCase())
        .limit(1)

      const hasRegistrations =
        (registrations && registrations.length > 0) ||
        (memberOf && memberOf.length > 0)

      if (!hasRegistrations) {
        return apiError('No registrations found for this email.', 404)
      }

      // Has registrations — reset password to what they entered and sign in
      const { error: updateError } = await admin.auth.admin.updateUserById(
        existingUser.id,
        { password }
      )

      if (updateError) {
        return apiError('Failed to update password. Try again.', 500)
      }

      const { data: retryData, error: retryError } =
        await supabase.auth.signInWithPassword({ email, password })

      if (retryError || !retryData.user) {
        return apiError('Sign in failed. Try again.', 500)
      }

      await linkRegistrations(email, retryData.user.id, admin)
      return apiSuccess({ message: 'Signed in', redirect: '/participant/portal' })
    }

    // Step 3 — No account — create with signUp
    const { data: signUpData, error: signUpError } =
      await supabase.auth.signUp({ email, password })

    if (signUpError) {
      console.error('[participant auth] signUp failed:', signUpError)
      return apiError('Failed to create account. Try again.', 500)
    }

    if (!signUpData.user) {
      return apiError('Account creation failed. Try again.', 500)
    }

    // If email confirmation required — confirm and sign in
    if (!signUpData.session) {
      await admin.auth.admin.updateUserById(signUpData.user.id, {
        email_confirm: true,
      })

      const { data: finalSignIn, error: finalError } =
        await supabase.auth.signInWithPassword({ email, password })

      if (finalError || !finalSignIn.user) {
        return apiError('Account created but sign-in failed. Try logging in again.', 500)
      }

      await linkRegistrations(email, finalSignIn.user.id, admin)
      return apiSuccess({
        message:   'Account created and signed in',
        redirect:  '/participant/portal',
        isNewUser: true,
      })
    }

    await linkRegistrations(email, signUpData.user.id, admin)
    return apiSuccess({
      message:   'Account created and signed in',
      redirect:  '/participant/portal',
      isNewUser: true,
    })

  } catch (err) {
    console.error('[POST /api/participant/auth/magic-link]', err)
    return apiError('Internal server error', 500)
  }
}

async function linkRegistrations(
  email: string,
  userId: string,
  admin: ReturnType<typeof createAdminClient>
) {
  await admin
    .from('registrations')
    .update({ participant_id: userId })
    .eq('leader_email', email.toLowerCase())
    .is('participant_id', null)
}