-- 014_participant_profiles.sql
-- A participant's own profile: personal details reused across event registrations.
-- Note: register_number here = the student's COLLEGE register/roll id (identity),
-- distinct from a registration's event id (registrations.display_id).

CREATE TABLE IF NOT EXISTS public.participant_profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       text,
  register_number text,          -- college register/roll number
  phone           text,
  college_email   text,          -- institutional email
  personal_email  text,          -- personal email (may differ)
  year_of_study   text,          -- '1st' | '2nd' | '3rd' | '4th' | 'Alumni'
  batch           text,          -- e.g. '2022-2026'
  section         text,          -- e.g. 'A' | 'B' | 'C'
  fa_name         text,          -- Faculty Advisor name
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- RLS: a participant may only read/write their own row. (Backstop — the API also
-- scopes by the authenticated user; the admin client bypasses RLS.)
ALTER TABLE public.participant_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "participant reads own profile" ON public.participant_profiles;
CREATE POLICY "participant reads own profile"
  ON public.participant_profiles FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "participant inserts own profile" ON public.participant_profiles;
CREATE POLICY "participant inserts own profile"
  ON public.participant_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "participant updates own profile" ON public.participant_profiles;
CREATE POLICY "participant updates own profile"
  ON public.participant_profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Organiser-selected "standard" fields on a registration form map to a profile key.
-- null = a fully custom field (default).
ALTER TABLE public.form_fields ADD COLUMN IF NOT EXISTS field_key text;
