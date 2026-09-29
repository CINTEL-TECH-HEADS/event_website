// app/api/contacts/[id]/route.ts
//   PATCH  — club organizers only: update a contact.
//   DELETE — club organizers only: remove a contact.

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { getUserAccess } from '@/lib/auth/get-session'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await getUserAccess()
  if (!access?.canManageClub) return apiError('Only club organizers can edit contacts.', 403)

  const { id } = await params
  try {
    const body = await req.json()
    const update: Record<string, unknown> = {}

    if (body.name !== undefined) {
      const name = String(body.name).trim()
      if (!name) return apiError('Name cannot be empty', 400)
      update.name = name
    }
    if (body.designation !== undefined) {
      const designation = String(body.designation).trim()
      if (!designation) return apiError('Designation cannot be empty', 400)
      update.designation = designation
    }
    if (body.email !== undefined) update.email = body.email?.trim() || null
    if (body.phone !== undefined) update.phone = body.phone?.trim() || null
    if (typeof body.sort_order === 'number') update.sort_order = body.sort_order

    if (Object.keys(update).length === 0) return apiError('Nothing to update', 400)

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('contacts')
      .update(update)
      .eq('id', id)
      .select('id, name, designation, email, phone, sort_order, created_at')
      .single()

    if (error) return apiError(error.message, 500)
    if (!data) return apiError('Contact not found', 404)
    return apiSuccess(data)
  } catch {
    return apiError('Malformed payload', 400)
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await getUserAccess()
  if (!access?.canManageClub) return apiError('Only club organizers can edit contacts.', 403)

  const { id } = await params
  const admin = createAdminClient()
  const { error } = await admin.from('contacts').delete().eq('id', id)
  if (error) return apiError(error.message, 500)
  return apiSuccess({ id })
}
