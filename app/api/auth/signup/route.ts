import { NextRequest, NextResponse } from 'next/server'
import { createSessionClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const signupSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(2, 'Full name is required'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = signupSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, password, full_name } = parsed.data
    const supabase = await createSessionClient()

    // 1. Sign up the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
        }
      }
    })

    if (authError) {
      return NextResponse.json(
        { data: null, error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { data: null, error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    const userId = authData.user.id
    const admin = createAdminClient()

    // 2. Create or update the organizer profile
    // Supabase often has triggers that auto-create profiles, so we upsert to avoid duplicate key errors.
    const { error: profileError } = await admin
      .from('profiles')
      .upsert({
        id: userId,
        email,
        full_name,
        role: 'organizer',
      })

    if (profileError) {
      // If profile insertion fails, ideally we should clean up the auth user,
      // but for this MVP, we just return the error.
      console.error('[POST /api/auth/signup] Profile insert error:', profileError)
      return NextResponse.json(
        { data: null, error: 'Failed to set up organizer profile. Please contact support.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: {
        id: userId,
        email,
        full_name,
        role: 'organizer'
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
