// app/api/contacts/route.ts
// Public "Contact Us" directory.
//   GET  — public: list all contacts (used by /contact and /dashboard/contacts).
//   POST — club organizers only: create a contact.
// Contacts are club-wide, so writes need a club organizer (profiles.role
// organizer/superadmin), not just a role on some event.

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { getUserAccess } from '@/lib/auth/get-session'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('contacts')
    .select('id, name, designation, email, phone, sort_order, created_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return apiError(error.message, 500)
  return apiSuccess(data ?? [])
}

export async function POST(req: NextRequest) {
  const access = await getUserAccess()
  if (!access?.canManageClub) return apiError('Only club organizers can edit contacts.', 403)

  try {
    const body = await req.json()
    const name = (body.name ?? '').trim()
    const designation = (body.designation ?? '').trim()
    if (!name || !designation) {
      return apiError('Name and designation are required', 400)
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('contacts')
      .insert({
        name,
        designation,
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        sort_order: typeof body.sort_order === 'number' ? body.sort_order : 0,
      })
      .select('id, name, designation, email, phone, sort_order, created_at')
      .single()

    if (error) return apiError(error.message, 500)
    return apiSuccess(data)
  } catch {
    return apiError('Malformed payload', 400)
  }
}
