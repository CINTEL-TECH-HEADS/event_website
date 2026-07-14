-- Migration: 008_attendance
-- Owner: BE1
-- IMPORTANT: The UNIQUE constraint on registration_id is the core duplicate-prevention mechanism
-- Do NOT remove it — it ensures only one check-in per registration at the DB level

CREATE TABLE IF NOT EXISTS attendance (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id   UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  event_id          UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  method            TEXT NOT NULL CHECK (method IN ('qr_scan', 'otp', 'manual')),
  checked_in_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checked_in_by     UUID REFERENCES profiles(id),

  -- This is the single most important constraint in the whole schema.
  -- Even if two organizers scan the same QR at the exact same millisecond,
  -- only one INSERT will succeed. The second will throw a unique violation (code 23505).
  CONSTRAINT attendance_registration_unique UNIQUE (registration_id)
);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- RLS: Organizers assigned to the event can SELECT and INSERT
-- See supabase/rls/attendance.sql for the actual policies
