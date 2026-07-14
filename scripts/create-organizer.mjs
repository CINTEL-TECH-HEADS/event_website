// scripts/create-organizer.mjs
//
// Create (or promote) an organizer account. Organizers are made manually — not via /signup.
//
// Usage:
//   node scripts/create-organizer.mjs <email> <password> "<Full Name>" [role] [eventId] [eventRole]
//
//   role      organizer | superadmin           (default: organizer)
//   eventId   optional — assign to this event
//   eventRole owner | sub_admin | judge         (default: owner)
//
// Examples:
//   node scripts/create-organizer.mjs jane@club.org 'Str0ngPass!' "Jane Doe"
//   node scripts/create-organizer.mjs boss@club.org 'Str0ngPass!' "Boss" superadmin
//   node scripts/create-organizer.mjs lead@club.org 'Str0ngPass!' "Lead" organizer 08864340-ccc2-46d9-abac-97a77341f19f owner
//
// Reads NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local.

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]
    })
)

const url = env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing in .env.local')
  process.exit(1)
}

const [email, password, fullName, role = 'organizer', eventId, eventRole = 'owner'] = process.argv.slice(2)
if (!email || !password || !fullName) {
  console.error('Usage: node scripts/create-organizer.mjs <email> <password> "<Full Name>" [role] [eventId] [eventRole]')
  process.exit(1)
}
if (!['organizer', 'superadmin'].includes(role)) {
  console.error("❌ role must be 'organizer' or 'superadmin'")
  process.exit(1)
}

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
const lowerEmail = email.toLowerCase()

// 1. Create the confirmed auth user (or find the existing one)
let userId
const { data: created, error: createErr } = await admin.auth.admin.createUser({
  email: lowerEmail,
  password,
  email_confirm: true,
  user_metadata: { full_name: fullName },
})

if (createErr) {
  if (/already/i.test(createErr.message)) {
    const { data: list } = await admin.auth.admin.listUsers()
    const existing = list?.users?.find((u) => u.email?.toLowerCase() === lowerEmail)
    if (!existing) { console.error('❌ user exists but could not be found'); process.exit(1) }
    userId = existing.id
    console.log('ℹ️  Account already existed — promoting it.')
  } else {
    console.error('❌ createUser failed:', createErr.message)
    process.exit(1)
  }
} else {
  userId = created.user.id
  console.log('✅ Auth user created:', lowerEmail)
}

// 2. Set the profile role (trigger created it as 'participant')
const { error: profErr } = await admin
  .from('profiles')
  .upsert({ id: userId, email: lowerEmail, full_name: fullName, role })
if (profErr) { console.error('❌ profile update failed:', profErr.message); process.exit(1) }
console.log(`✅ Profile role set to '${role}'.`)

// 3. Optionally assign to an event
if (eventId) {
  const { error: orgErr } = await admin
    .from('event_organizers')
    .upsert({ event_id: eventId, profile_id: userId, role: eventRole }, { onConflict: 'event_id,profile_id' })
  if (orgErr) { console.error('❌ event assignment failed:', orgErr.message); process.exit(1) }
  console.log(`✅ Assigned as '${eventRole}' on event ${eventId}.`)
}

console.log('\nDone. They can now sign in at /login →', role === 'superadmin' ? '/dashboard (all events)' : '/dashboard')
