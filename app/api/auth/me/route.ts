// app/api/auth/me/route.ts
//
// GET /api/auth/me — lightweight session probe for client UI (the public
// header). Returns the current user's auth state, role and home route so a
// client component can render the right nav without making the whole layout
// dynamic. Never cached.

import { NextResponse } from 'next/server'
import { getUserAccess } from '@/lib/auth/get-session'

export const dynamic = 'force-dynamic'

export async function GET() {
  const access = await getUserAccess()

  const body = access
    ? {
        authenticated: true,
        email: access.user.email,
        role: access.role,
        home: access.home,
        can_manage_club: access.canManageClub,
      }
    : { authenticated: false, email: null, role: null, home: null, can_manage_club: false }

  return NextResponse.json(body, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
