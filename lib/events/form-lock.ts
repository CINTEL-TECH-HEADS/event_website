// lib/events/form-lock.ts
//
// An event's registration form is settled before publishing and can't change
// after: it is locked while the event is published, and for good once anyone
// has registered (unpublishing doesn't reopen it). Registrants' answers point
// at the form's fields, so rewriting the form under them breaks those answers.
// "Open to students from other colleges" decides which forms exist, so it is
// locked along with the form.

import type { SupabaseClient } from '@supabase/supabase-js'

export type FormLock = 'published' | 'registrations' | null

export async function getFormLock(
  admin: SupabaseClient,
  eventId: string,
  isPublished: boolean | null | undefined
): Promise<FormLock> {
  if (isPublished) return 'published'
  const { count, error } = await admin
    .from('registrations')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)
  if (error) throw error
  return (count ?? 0) > 0 ? 'registrations' : null
}

export function formLockMessage(lock: Exclude<FormLock, null>, what: 'form' | 'audience' = 'form'): string {
  const subject = what === 'form'
    ? 'The registration form'
    : 'Who can register (open to other colleges)'
  return lock === 'published'
    ? `${subject} can't be changed while the event is published.`
    : `${subject} can't be changed because people have already registered.`
}
