-- 016_group_code_teams.sql
-- Group-code team model: teams are created/joined via a shareable code instead of
-- a leader typing every member in. Members are linked to their accounts, the team
-- shares one QR (one attendance), and certificates are issued per member.
--
--   registrations.group_code   the shareable team code (team rows only; null for solo)
--   registrations.is_open      whether the team appears in the Team Finder / accepts joins
--   team_members.participant_id account link (set when a logged-in user creates/joins)
--   certificates.team_member_id per-member certificate for team events (null for solo)

-- ── Team identity on the registration (the team *is* the registration row) ──
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS group_code text;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS is_open boolean NOT NULL DEFAULT true;

-- One code = one team. Partial unique index (ignores solo rows where group_code is null).
CREATE UNIQUE INDEX IF NOT EXISTS registrations_group_code_key
  ON public.registrations (group_code)
  WHERE group_code IS NOT NULL;

-- ── Account link on team members (replaces email-only matching) ──
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS participant_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS team_members_participant_id_idx
  ON public.team_members (participant_id);

-- ── Per-member certificates ──
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS team_member_id uuid REFERENCES public.team_members(id) ON DELETE CASCADE;

-- A member has at most one certificate per event; solo rows keep team_member_id null.
CREATE UNIQUE INDEX IF NOT EXISTS certificates_event_member_key
  ON public.certificates (event_id, team_member_id)
  WHERE team_member_id IS NOT NULL;

-- The old one-cert-per-registration constraint blocks per-member team certs
-- (all members share a registration). Replace it with a solo-only partial unique.
ALTER TABLE public.certificates DROP CONSTRAINT IF EXISTS certificates_unique_registration_event;

CREATE UNIQUE INDEX IF NOT EXISTS certificates_solo_registration_event_key
  ON public.certificates (registration_id, event_id)
  WHERE team_member_id IS NULL;
