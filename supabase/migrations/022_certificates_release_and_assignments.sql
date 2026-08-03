-- 022_certificates_release_and_assignments.sql
-- ADDITIVE ONLY — Ensures events.certificates_released_at and
-- certificate_assignments.certificate_file_url exist and enables RLS policies.

-- 1. Ensure events has certificates_released_at column
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS certificates_released_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Ensure certificate_assignments has certificate_file_url column
ALTER TABLE public.certificate_assignments
  ADD COLUMN IF NOT EXISTS certificate_file_url TEXT DEFAULT NULL;

-- 3. Enable RLS on certificate_assignments
ALTER TABLE public.certificate_assignments ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy for certificate_assignments: Allow public select for verification & participant viewing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'certificate_assignments' AND policyname = 'Public select certificate_assignments'
  ) THEN
    CREATE POLICY "Public select certificate_assignments"
      ON public.certificate_assignments
      FOR SELECT
      USING (true);
  END IF;
END $$;
