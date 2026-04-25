// lib/supabase/server.ts
// Two Supabase clients for server-side use:
//
//  createSessionClient — reads the logged-in user's cookie.
//                        Use this in middleware and any route that needs
//                        to know WHO is making the request.
//
//  createAdminClient  — uses the service role key, bypasses RLS entirely.
//                       Use this in API routes that need full DB access
//                       (e.g. inserting registrations, reading all events).
//                       NEVER expose this to the browser.

import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types'

export async function createSessionClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
}

// ── Admin client (service role, bypasses RLS) ────────────────
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}