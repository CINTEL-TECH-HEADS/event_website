// app/api/auth/logout/route.ts
//
// POST /api/auth/logout
//
// Signs the user out everywhere and fully evicts the browser session:
//  - global signOut() revokes the refresh token server-side
//  - cookies are cleared on the returned response (bound-cookie pattern)
//  - Clear-Site-Data tells the browser to drop cached pages (bfcache),
//    cookies and storage, so Back/Forward can't resurrect a protected page.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

type CookieItem = { name: string; value: string; options?: any }

export async function POST() {
  const cookieStore = await cookies()
  const res = NextResponse.json({ data: { message: 'Signed out' }, error: null })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: CookieItem[]) {
            cookiesToSet.forEach(({ name, value, options }: CookieItem) =>
              res.cookies.set(name, value, options)
            )
          },
        },
      }
    )
    await supabase.auth.signOut({ scope: 'global' })
  } catch (error) {
    console.error('Logout error:', error)
  }

  // Belt-and-suspenders: drop cached pages, cookies and storage in the browser.
  res.headers.set('Clear-Site-Data', '"cache", "cookies", "storage"')
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
  return res
}
