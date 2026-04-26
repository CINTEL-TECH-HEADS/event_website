// app/api/auth/logout/route.ts
//
// POST /api/auth/logout
// No body required.
//
// Signs the user out and clears the session cookie.
// FE2 calls this when the organizer clicks "Sign out" in the sidebar.

import { NextRequest, NextResponse } from 'next/server'
import { createSessionClient } from '@/lib/supabase/server'
import { apiSuccess } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSessionClient()
    await supabase.auth.signOut()
    return apiSuccess({ message: 'Signed out' })
  } catch (error) {
    console.error('Logout error:', error)
    return apiSuccess({ message: 'Signed out' })
  }
}
