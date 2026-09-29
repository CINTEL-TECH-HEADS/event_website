-- 030_fix_registration_policies.sql
-- "participant_read_own_registrations" looked up team_members (whose organizer
-- policy looks up registrations: infinite recursion) and auth.users (which the
-- authenticated role can't read), so every direct read of registrations,
-- team_members and registration_answers errored. Replace it with an own-row
-- check on the account that registered. (The app reads these through the
-- server, so this only affects direct API access.)

DROP POLICY IF EXISTS "participant_read_own_registrations" ON public.registrations;

CREATE POLICY "registrations: participant select own" ON public.registrations
  FOR SELECT TO authenticated USING (participant_id = auth.uid());
