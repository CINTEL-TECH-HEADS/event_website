// app/api/auth/login/route.ts
//
// POST /api/auth/login
// Body: { email: string, password: string }
//
// Signs the organizer in with Supabase email+password auth.
// On success, Supabase sets a session cookie automatically.
// Returns the user's profile (id, email, role, full_name).

import { NextRequest, NextResponse } from 'next/server'
import { createSessionClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: parsed.error.errors[0].message,
        },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data

    const supabase = await createSessionClient()

    const {
      data: authData,
      error: authError,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        {
          data: null,
          error: 'Invalid email or password',
        },
        { status: 401 }
      )
    }

    const admin = createAdminClient()

    const {
      data: profile,
      error: profileError,
    } = await admin
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        {
          data: null,
          error: 'Profile not found. Contact a superadmin.',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: profile,
      error: null,
    })
  } catch (err) {
    console.error('[POST /api/auth/login]', err)

    return NextResponse.json(
      {
        data: null,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}