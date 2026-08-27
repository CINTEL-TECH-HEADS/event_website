-- 024_profile_identity.sql
-- Every participant account must carry ONE college email (@srmist.edu.in) and
-- ONE registration number (RA…), unique across accounts. These partial unique
-- indexes enforce "no duplicates" while allowing rows that haven't filled them
-- in yet (null). Case-insensitive so casing can't create duplicates.

CREATE UNIQUE INDEX IF NOT EXISTS participant_profiles_college_email_key
  ON public.participant_profiles (lower(college_email))
  WHERE college_email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS participant_profiles_register_number_key
  ON public.participant_profiles (upper(register_number))
  WHERE register_number IS NOT NULL;
