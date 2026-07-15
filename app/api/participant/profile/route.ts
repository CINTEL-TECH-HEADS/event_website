// app/api/participant/profile/route.ts
// GET   — the logged-in participant's profile (falls back to their latest registration)
// PATCH — upsert the profile
//
// Auth-scoped by getAuthUser(); the admin client bypasses RLS so the route must
// (and does) key everything to the authenticated user's id.

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { getAuthUser } from '@/lib/auth/get-session'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const nullableStr = z.string().trim().max(200).optional().nullable()

const profileSchema = z.object({
  full_name: nullableStr,
  register_number: nullableStr,
  phone: nullableStr,
  college_email: nullableStr,
  personal_email: nullableStr,
  year_of_study: nullableStr,
  batch: nullableStr,
  section: nullableStr,
  fa_name: nullableStr,
})

const empty = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v)

export async function GET() {
  const user = await getAuthUser()
  if (!user) return apiError('Not authenticated', 401)

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('participant_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (profile) {
    return apiSuccess({ profile, exists: true })
  }

  // No profile yet — seed from the person's most recent registration (name/phone/email)
  const { data: reg } = await admin
    .from('registrations')
    .select('leader_name, leader_phone, leader_email, registered_at')
    .eq('leader_email', (user.email ?? '').toLowerCase())
    .order('registered_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return apiSuccess({
    exists: false,
    profile: {
      id: user.id,
      full_name: reg?.leader_name ?? null,
      register_number: null,
      phone: reg?.leader_phone ?? null,
      college_email: null,
      personal_email: reg?.leader_email ?? user.email ?? null,
      year_of_study: null,
      batch: null,
      section: null,
      fa_name: null,
      updated_at: null,
    },
  })
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return apiError('Not authenticated', 401)

  const body = await req.json()
  const parsed = profileSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.errors[0].message, 400)

  const admin = createAdminClient()
  const row: Record<string, unknown> = { id: user.id, updated_at: new Date().toISOString() }
  for (const [k, v] of Object.entries(parsed.data)) row[k] = empty(v)

  const { data, error } = await admin
    .from('participant_profiles')
    .upsert(row)
    .select()
    .single()

  if (error) return apiError(error.message, 500)
  return apiSuccess({ profile: data, exists: true })
}
