-- 019_profile_networking_fields.sql
-- Networking fields for the participant profile, surfaced in Find Teammates so
-- people can review skills/interests and reach out before forming a team.

ALTER TABLE public.participant_profiles ADD COLUMN IF NOT EXISTS department   text;
ALTER TABLE public.participant_profiles ADD COLUMN IF NOT EXISTS skills       text;
ALTER TABLE public.participant_profiles ADD COLUMN IF NOT EXISTS interests    text;
ALTER TABLE public.participant_profiles ADD COLUMN IF NOT EXISTS linkedin_url text;
ALTER TABLE public.participant_profiles ADD COLUMN IF NOT EXISTS github_url   text;
