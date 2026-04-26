// lib/supabase/client.ts
// Browser-side Supabase client — uses the anon key.
// RLS policies control what this client can and cannot access.
// NEVER use the service role key here.
//
// Usage (in a client component):
//   import { createBrowserClient } from '@/lib/supabase/client'
//   const supabase = createBrowserClient()

'use client'

import {
  createBrowserClient as _createBrowserClient,
} from '@supabase/ssr'

export function createBrowserClient() {
  return _createBrowserClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}