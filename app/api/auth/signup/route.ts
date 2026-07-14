// app/api/auth/signup/route.ts
//
// POST /api/auth/signup  — create a PARTICIPANT account.
// Body: { email, password, full_name }
//
// Organizers are NOT created here — an admin makes those manually
// (see scripts/create-organizer.mjs). The handle_new_user DB trigger
// auto-creates the profile with role 'participant'.

import { NextRequest, NextResponse } from 'next/server'
import { createSessionClient, createAdminClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const signupSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    if (!rateLimit('login', ip).success) {
      return NextResponse.json(
        { data: null, error: 'Too many attempts. Please wait a few minutes and try again.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const parsed = signupSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const email = parsed.data.email.toLowerCase()
    const { password } = parsed.data
    const supabase = await createSessionClient()
    const admin = createAdminClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    // Create the auth user. The DB trigger creates the profile as 'participant'.
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${appUrl}/api/auth/callback`,
      },
    })

    if (authError) {
      return NextResponse.json({ data: null, error: authError.message }, { status: 400 })
    }
    if (!authData.user) {
      return NextResponse.json(
        { data: null, error: 'Failed to create account.' },
        { status: 500 }
      )
    }

    // Link any existing registrations for this email to the new account
    await admin
      .from('registrations')
      .update({ participant_id: authData.user.id })
      .eq('leader_email', email)
      .is('participant_id', null)

    // If email confirmation is required there's no session yet — ask them to verify.
    const needsVerification = !authData.session

    return NextResponse.json({
      data: {
        email,
        role: 'participant',
        needsVerification,
        redirect: needsVerification ? null : '/participant/portal',
        message: needsVerification
          ? 'Check your email to verify your account, then sign in.'
          : null,
      },
      error: null,
    })
  } catch (err) {
    console.error('[POST /api/auth/signup]', err)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
