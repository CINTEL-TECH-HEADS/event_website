-- ============================================================
-- PARTICIPANT PORTAL — DATABASE MIGRATION
-- Run this in Supabase SQL editor AFTER the main setup SQL.
-- ============================================================

-- 1. Add participant_id to registrations table
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS participant_id UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_registrations_participant_id
  ON registrations(participant_id);

-- 2. Create team_invite_codes table
CREATE TABLE IF NOT EXISTS team_invite_codes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code             TEXT NOT NULL UNIQUE,
  registration_id  UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  event_id         UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_by_email TEXT NOT NULL,
  max_uses         INT NOT NULL DEFAULT 1,
  uses             INT NOT NULL DEFAULT 0,
  expires_at       TIMESTAMPTZ NOT NULL,
  is_revoked       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE team_invite_codes ENABLE ROW LEVEL SECURITY;

-- 3. RLS — participants can read their own registrations
CREATE POLICY "participant_read_own_registrations"
  ON registrations FOR SELECT
  USING (
    leader_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
    OR
    id IN (
      SELECT registration_id FROM team_members
      WHERE email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
  );

-- 4. RLS — leaders can manage invite codes
CREATE POLICY "leader_manage_invite_codes"
  ON team_invite_codes FOR ALL
  USING (
    created_by_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- 5. Anyone can read invite codes (needed for public join page)
CREATE POLICY "public_read_invite_codes"
  ON team_invite_codes FOR SELECT
  USING (TRUE);
