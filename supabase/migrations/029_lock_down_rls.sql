-- 029_lock_down_rls.sql
-- Row-level security clean-up after the Supabase Security Advisor flagged
-- three tables. The app reads and writes every table from the server with the
-- service-role key (which bypasses RLS); signed-in sessions are only used to
-- identify people, and the browser only subscribes to attendance inserts
-- (Realtime). So the public (anon) and signed-in (authenticated) roles need no
-- direct writes and no reads beyond their own rows, published events, and the
-- events they organize.

-- 1. RLS was off: anyone with the public key could read and change these.
ALTER TABLE public.contacts                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_submissions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_certificate_templates ENABLE ROW LEVEL SECURITY;

-- 2. "Anyone can read every row": names, emails, phones, invite codes.
DROP POLICY IF EXISTS "registrations: public select own by id" ON public.registrations;
DROP POLICY IF EXISTS "team_members: public select"            ON public.team_members;
DROP POLICY IF EXISTS "public_read_invite_codes"               ON public.team_invite_codes;
DROP POLICY IF EXISTS "leader_manage_invite_codes"             ON public.team_invite_codes; -- table unused

-- 3. Direct writes. Every write goes through the API, which checks it; these let
--    people skip the checks (make themselves superadmin, fake an SRM profile,
--    publish an event, register past the rules, edit a locked form, ...).
DROP POLICY IF EXISTS "profiles: update own"                         ON public.profiles;
DROP POLICY IF EXISTS "participant inserts own profile"              ON public.participant_profiles;
DROP POLICY IF EXISTS "participant updates own profile"              ON public.participant_profiles;
DROP POLICY IF EXISTS "events: organizer insert"                     ON public.events;
DROP POLICY IF EXISTS "events: owner update"                         ON public.events;
DROP POLICY IF EXISTS "events: owner delete (soft)"                  ON public.events;
DROP POLICY IF EXISTS "event_organizers: owner or superadmin insert" ON public.event_organizers;
DROP POLICY IF EXISTS "event_organizers: owner or superadmin delete" ON public.event_organizers;
DROP POLICY IF EXISTS "form_fields: owner insert"                    ON public.form_fields;
DROP POLICY IF EXISTS "form_fields: owner update"                    ON public.form_fields;
DROP POLICY IF EXISTS "form_fields: owner delete"                    ON public.form_fields;
DROP POLICY IF EXISTS "registrations: public insert"                 ON public.registrations;
DROP POLICY IF EXISTS "registrations: organizer update"              ON public.registrations;
DROP POLICY IF EXISTS "registration_answers: public insert"          ON public.registration_answers;
DROP POLICY IF EXISTS "team_members: public insert"                  ON public.team_members;
DROP POLICY IF EXISTS "attendance: organizer insert"                 ON public.attendance;
DROP POLICY IF EXISTS "attendance: organizer update"                 ON public.attendance;
DROP POLICY IF EXISTS "certificates: organizer insert"               ON public.certificates;
DROP POLICY IF EXISTS "duplicate_flags: organizer update"            ON public.duplicate_flags;
DROP POLICY IF EXISTS "duplicate_flags: organizer delete"            ON public.duplicate_flags;

-- 4. Policies that queried their own table ("infinite recursion"): every read
--    of registrations, team_members, profiles, ... errored instead of being
--    filtered. Replace with plain own-row checks.
DROP POLICY IF EXISTS "event_organizers: select for own events" ON public.event_organizers;
CREATE POLICY "event_organizers: select own" ON public.event_organizers
  FOR SELECT TO authenticated USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "profiles: superadmin select all" ON public.profiles;
