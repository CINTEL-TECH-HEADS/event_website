-- 018_team_name_unique.sql
-- Team names are unique per event (case-insensitive). Two different events may
-- reuse the same team name. Solo rows (team_name null) are ignored.

CREATE UNIQUE INDEX IF NOT EXISTS registrations_event_team_name_key
  ON public.registrations (event_id, lower(team_name))
  WHERE registration_type = 'team' AND team_name IS NOT NULL;
