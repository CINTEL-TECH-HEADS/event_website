// app/api/auth/logout/route.ts
//
// POST /api/auth/logout
// No body required.
//
// Signs the user out and clears the session cookie.
// FE2 calls this when the organizer clicks "Sign out" in the sidebar.

import { NextResponse } from 'next/server'
import { createSessionClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createSessionClient()
  await supabase.auth.signOut()
  return apiSuccess({ message: 'Signed out' })
}
