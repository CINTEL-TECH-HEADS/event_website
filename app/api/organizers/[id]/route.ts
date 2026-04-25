// app/api/organizers/[id]/route.ts
// DELETE /api/organizers/[id] — remove an organizer from an event
// Only the event owner or superadmin can call this
// Cannot remove the owner themselves

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOrganizerRole } from '@/lib/auth/get-session'

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params
        const admin = createAdminClient()

        // Fetch the organizer record first to get event_id
        const { data: organizer, error: fetchError } = await admin
            .from('event_organizers')
            .select('id, event_id, role, profile_id')
            .eq('id', id)
            .single()

        if (fetchError || !organizer) {
            return NextResponse.json(
                { data: null, error: 'Organizer record not found' },
                { status: 404 }
            )
        }

        // Cannot remove the owner
        if (organizer.role === 'owner') {
            return NextResponse.json(
                { data: null, error: 'Cannot remove the event owner. Transfer ownership first.' },
                { status: 400 }
            )
        }

        // Only owners can remove organizers
        const auth = await requireOrganizerRole(organizer.event_id, ['owner'])
        if ('error' in auth) {
            return NextResponse.json(
                { data: null, error: auth.error },
                { status: auth.status }
            )
        }

        const { error: deleteError } = await admin
            .from('event_organizers')
            .delete()
            .eq('id', id)

        if (deleteError) {
            console.error('[DELETE /api/organizers/[id]]', deleteError)
            return NextResponse.json(
                { data: null, error: 'Failed to remove organizer' },
                { status: 500 }
            )
        }

        return NextResponse.json(
            { data: { message: 'Organizer removed' }, error: null }
        )
    } catch (err) {
        console.error('[DELETE /api/organizers/[id]]', err)
        return NextResponse.json(
            { data: null, error: 'Internal server error' },
            { status: 500 }
        )
    }
}