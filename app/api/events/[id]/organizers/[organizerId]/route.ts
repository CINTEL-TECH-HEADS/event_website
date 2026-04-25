// Owner: BE2
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOrganizerRole } from '@/lib/auth/get-session'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; organizerId: string } }
) {
  const auth = await requireOrganizerRole(params.id, ['owner'])
  if ('error' in auth) return apiError(auth.error, auth.status)

  const supabase = createAdminClient()

  // Protect owner and self deletions
  const { data: org } = await supabase
    .from('event_organizers')
    .select('role, profile_id')
    .eq('id', params.organizerId)
    .single()

  if (!org) return apiError('Organizer not found', 404)
  if (org.role === 'owner') return apiError('Cannot remove owner', 400)
  if (org.profile_id === auth.user.id) return apiError('Cannot remove yourself', 400)

  const { error } = await supabase
    .from('event_organizers')
    .delete()
    .eq('id', params.organizerId)
    .eq('event_id', params.id)

  if (error) return apiError(error.message, 500)

  return apiSuccess({ deleted: true })
}
