// lib/registrations/group-code.ts
//
// Shareable team code (group-code model). Human-friendly, unambiguous alphabet
// (no 0/O/1/I), prefixed so it reads as a Cintel team code. Uniqueness is
// checked against registrations.group_code.

import type { SupabaseClient } from '@supabase/supabase-js'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function randomCode(): string {
  let code = 'TEAM-'
  for (let i = 0; i < 5; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return code
}

export async function generateUniqueGroupCode(admin: SupabaseClient): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const code = randomCode()
    const { data } = await admin
      .from('registrations')
      .select('id')
      .eq('group_code', code)
      .maybeSingle()
    if (!data) return code
  }
  // Extremely unlikely; fall back to a longer random suffix.
  return `TEAM-${Date.now().toString(36).toUpperCase()}`
}
