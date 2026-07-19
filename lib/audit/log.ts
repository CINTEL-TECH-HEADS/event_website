// lib/audit/log.ts
// Records organizer actions to the audit_log table.
// Fire-and-forget: logging must NEVER break the action it's recording.

import { createAdminClient } from '@/lib/supabase/server'

export interface AuditEntry {
  actorId?: string | null
  actorEmail?: string | null
  action: string                       // e.g. 'event.delete', 'attendance.checkin'
  targetType?: string | null           // 'event' | 'registration' | 'organizer' | ...
  targetId?: string | null
  eventId?: string | null
  metadata?: Record<string, unknown> | null
}

export async function logAction(entry: AuditEntry): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.from('audit_log').insert({
      actor_id: entry.actorId ?? null,
      actor_email: entry.actorEmail ?? null,
      action: entry.action,
      target_type: entry.targetType ?? null,
      target_id: entry.targetId ?? null,
      event_id: entry.eventId ?? null,
      metadata: entry.metadata ?? null,
    })
  } catch (err) {
    console.error('[audit] failed to record', entry.action, err)
  }
}
