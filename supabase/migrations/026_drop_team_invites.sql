-- 026_drop_team_invites.sql
-- The Team Finder / matchmaking feature (invites and join requests) was removed
-- from the app; teams now form only by group code. Drop its table (017).
-- It was empty when dropped, with no foreign keys, views or functions using it.
-- To restore it, re-run 017_team_invites.sql.

DROP POLICY IF EXISTS "read own team invites" ON public.team_invites;
DROP TABLE IF EXISTS public.team_invites;
