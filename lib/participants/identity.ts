// lib/participants/identity.ts
//
// Who a participant is, for the first-time setup gate and for which events
// they can see. SRM IST students give a registration number and their
// @srmist.edu.in email; students from other colleges give their college name
// and a phone number instead, and can only see and register for events marked
// open_to_external. Organizers are never "external".

import type { SupabaseClient } from '@supabase/supabase-js'

export type Affiliation = 'srm' | 'external'

type IdentityFields = {
  affiliation?: string | null
  college_email?: string | null
  register_number?: string | null
  college_name?: string | null
  phone?: string | null
}

export function isProfileComplete(p: IdentityFields | null | undefined): boolean {
  if (!p) return false
  if (p.affiliation === 'external') return !!p.college_name && !!p.phone
  // 'srm', or a profile from before affiliation existed.
  return !!p.college_email && !!p.register_number
}

// True when the signed-in user is a participant from another college.
export async function isExternalParticipant(admin: SupabaseClient, userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false
  const { data } = await admin
    .from('participant_profiles')
    .select('affiliation')
    .eq('id', userId)
    .maybeSingle()
  return data?.affiliation === 'external'
}

export function canAccessEvent(external: boolean, event: { open_to_external?: boolean | null }): boolean {
  return !external || event.open_to_external === true
}

export const SRM_ONLY_MESSAGE = 'This event is open to SRM IST students only.'
