// lib/auth/get-session.ts
//
// Two helpers used inside API route handlers:
//
//  getAuthUser(req)
//    → Returns the logged-in user from their session cookie.
//    → Use this at the top of any organizer-only route.
//    → Returns null if not logged in.
//
//  requireOrganizerRole(req, eventId, allowedRoles)
//    → Confirms the logged-in user is an organizer of the given event
//      with one of the allowed roles.
//    → Returns { user, organizerRole } on success.
//    → Returns { error, status } on failure — return that directly from
//      your route handler.
//
// Usage example in an API route:
//
//   const auth = await requireOrganizerRole(req, eventId, ['owner', 'sub_admin'])
//   if ('error' in auth) {
//     return NextResponse.json({ data: null, error: auth.error }, { status: auth.status })
//   }
//   // auth.user and auth.organizerRole are now available

import { createSessionClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

type OrganizerRole = 'owner' | 'sub_admin' | 'judge'

// ── Get the current logged-in user ───────────────────────────
export async function getAuthUser() {
    try {
        const supabase = await createSessionClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) return null
        return user
    } catch {
        return null
    }
}

// ── Resolve the current user's access (role/home) without an event ───
//
// Single source of truth for "what can this user reach and where do they
// belong". Used by layout gates, the /api/auth/me endpoint and the login
// route. Mirrors the organizer definition used in requireOrganizerRole:
// a superadmin/organizer profile OR any event_organizers membership
// (owner/sub_admin/judge) counts as an organizer.
export type UserAccess = {
    user: { id: string; email: string }
    role: 'superadmin' | 'organizer' | 'participant'
    isOrganizer: boolean
    home: string
}

// Resolve access for a known user id/email. Callable right after sign-in
// (before the session cookie is committed) — the login route uses this.
export async function resolveUserAccess(
    userId: string,
    email: string
): Promise<UserAccess> {
    const admin = createAdminClient()

    const { data: profile } = await admin
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle()

    const { data: orgRows } = await admin
        .from('event_organizers')
        .select('id')
        .eq('profile_id', userId)
        .limit(1)

    const isOrganizer =
        profile?.role === 'superadmin' ||
        profile?.role === 'organizer' ||
        (orgRows?.length ?? 0) > 0

    const role: UserAccess['role'] =
        profile?.role === 'superadmin'
            ? 'superadmin'
            : isOrganizer
                ? 'organizer'
                : 'participant'

    return {
        user: { id: userId, email },
        role,
        isOrganizer,
        home: isOrganizer ? '/dashboard' : '/participant/portal',
    }
}

export async function getUserAccess(): Promise<UserAccess | null> {
    const user = await getAuthUser()
    if (!user) return null
    return resolveUserAccess(user.id, user.email!)
}

// ── Require organizer role on a specific event ───────────────
export async function requireOrganizerRole(
    eventId: string,
    allowedRoles: OrganizerRole[]
): Promise<
    | { user: { id: string; email: string }; organizerRole: OrganizerRole }
    | { error: string; status: number }
> {
    const user = await getAuthUser()

    if (!user) {
        return { error: 'Not authenticated', status: 401 }
    }

    const admin = createAdminClient()

    // Check if this user is a superadmin — superadmins bypass role checks
    const { data: profile } = await admin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    // Organizers and superadmins have global access to every event.
    // (Organizers are trusted, manually-created staff.)
    if (profile?.role === 'superadmin' || profile?.role === 'organizer') {
        return {
            user: { id: user.id, email: user.email! },
            organizerRole: 'owner', // treat as owner for permission purposes
        }
    }

    // Check event_organizers table
    const { data: organizer, error } = await admin
        .from('event_organizers')
        .select('role')
        .eq('event_id', eventId)
        .eq('profile_id', user.id)
        .single()

    if (error || !organizer) {
        return { error: 'You are not an organizer for this event', status: 403 }
    }

    if (!allowedRoles.includes(organizer.role as OrganizerRole)) {
        return {
            error: `This action requires one of these roles: ${allowedRoles.join(', ')}`,
            status: 403,
        }
    }

    return {
        user: { id: user.id, email: user.email! },
        organizerRole: organizer.role as OrganizerRole,
    }
}