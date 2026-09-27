-- 025_external_participants.sql
-- Students from other colleges.
--   participant_profiles.affiliation: 'srm' | 'external' (null until chosen at setup).
--     SRM students give a registration number + @srmist.edu.in email; students from
--     other colleges give their college name + phone instead.
--   events.open_to_external: other-college students only see and register for
--     events with this on.

ALTER TABLE public.participant_profiles
  ADD COLUMN IF NOT EXISTS affiliation text,
  ADD COLUMN IF NOT EXISTS college_name text;

ALTER TABLE public.participant_profiles DROP CONSTRAINT IF EXISTS participant_profiles_affiliation_check;
ALTER TABLE public.participant_profiles
  ADD CONSTRAINT participant_profiles_affiliation_check CHECK (affiliation IN ('srm', 'external'));

-- Everyone who already completed the SRM details is an SRM student.
UPDATE public.participant_profiles
   SET affiliation = 'srm'
 WHERE affiliation IS NULL
   AND college_email IS NOT NULL;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS open_to_external boolean NOT NULL DEFAULT false;
