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
import { isProfileComplete } from '@/lib/participants/identity'

const nullableStr = z.string().trim().max(200).optional().nullable()
const nullableText = z.string().trim().max(600).optional().nullable()

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
  // Networking fields (no longer shown in the UI; kept so saved values survive)
  department: nullableStr,
  skills: nullableText,
  interests: nullableText,
  linkedin_url: nullableStr,
  github_url: nullableStr,
  // 'srm' (SRM KTR student) or 'external' (student from another college)
  affiliation: z.enum(['srm', 'external']).optional().nullable(),
  college_name: nullableStr,
})

const empty = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v)

const COLLEGE_EMAIL_RE = /@srmist\.edu\.in$/i
const REGISTER_NUMBER_RE = /^RA\d+$/i

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
    return apiSuccess({ profile, exists: true, complete: isProfileComplete(profile) })
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
    complete: false,
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
      department: null,
      skills: null,
      interests: null,
      linkedin_url: null,
      github_url: null,
      affiliation: null,
      college_name: null,
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

  // Which kind of participant this is: from this request, else what's on file
  // (profiles from before affiliation existed count as SRM once they have SRM details).
  const { data: existing } = await admin
    .from('participant_profiles')
    .select('affiliation, college_email')
    .eq('id', user.id)
    .maybeSingle()
  const affiliation =
    (row.affiliation as string | null | undefined) ??
    existing?.affiliation ??
    (existing?.college_email ? 'srm' : null)

  if (affiliation === 'external') {
    // Other colleges have neither an SRM registration number nor an
    // @srmist.edu.in address; don't store (or validate) those fields for them.
    delete row.register_number
    delete row.college_email
  } else {
    // SRM identity format checks (only when a value is present).
    const collegeEmail = row.college_email as string | null
    if (collegeEmail && !COLLEGE_EMAIL_RE.test(collegeEmail)) {
      return apiError('College email must be a valid @srmist.edu.in address.', 400)
    }
    let registerNumber = row.register_number as string | null
    if (registerNumber) {
      registerNumber = registerNumber.toUpperCase()
      if (!REGISTER_NUMBER_RE.test(registerNumber)) {
        return apiError('Registration number must start with "RA" followed by digits.', 400)
      }
      row.register_number = registerNumber
    }
  }

  const { data, error } = await admin
    .from('participant_profiles')
    .upsert(row)
    .select()
    .single()

  if (error) {
    // Partial unique index violation → this college email / reg number is taken.
    if ((error as any).code === '23505') {
      return apiError('That college email or registration number is already linked to another account.', 409)
    }
    return apiError(error.message, 500)
  }
  return apiSuccess({ profile: data, exists: true, complete: isProfileComplete(data) })
}
