-- 017_team_invites.sql
-- Two-sided team matchmaking for team events. A "seeker" is an open team-of-one
-- (registrations.is_open = true, one member). A team short of members and a
-- seeker find each other and a team forms only on acceptance:
--   direction 'invite'  → team invited the seeker; the SEEKER accepts.
--   direction 'request' → seeker asked to join the team; the CREATOR accepts.
-- On accept the seeker is merged into the team and their team-of-one dissolved.

CREATE TABLE IF NOT EXISTS public.team_invites (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id               uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  team_registration_id   uuid NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  seeker_participant_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seeker_registration_id uuid NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  direction              text NOT NULL CHECK (direction IN ('invite', 'request')),
  status                 text NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  initiated_by           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at             timestamptz NOT NULL DEFAULT now(),
  responded_at           timestamptz
);

CREATE INDEX IF NOT EXISTS team_invites_event_idx        ON public.team_invites (event_id);
CREATE INDEX IF NOT EXISTS team_invites_team_status_idx  ON public.team_invites (team_registration_id, status);
CREATE INDEX IF NOT EXISTS team_invites_seeker_status_idx ON public.team_invites (seeker_participant_id, status);

-- No duplicate pending pair between the same team and seeker.
CREATE UNIQUE INDEX IF NOT EXISTS team_invites_pending_pair_key
  ON public.team_invites (team_registration_id, seeker_participant_id)
  WHERE status = 'pending';

-- RLS backstop — the API uses the admin client and self-authorizes. Allow a user
-- to read rows where they are the seeker or the initiator; writes go through the API.
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read own team invites" ON public.team_invites;
CREATE POLICY "read own team invites"
  ON public.team_invites FOR SELECT
  USING (seeker_participant_id = auth.uid() OR initiated_by = auth.uid());
