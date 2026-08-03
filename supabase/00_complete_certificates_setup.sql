-- COMPLETE CERTIFICATES DATABASE SETUP
-- Copy and paste this script into your Supabase SQL Editor (https://supabase.com/dashboard/project/jokcuuftvqehycawioba/sql)
-- to ensure all tables, columns, indexes, storage buckets, and RLS policies exist.

-- 1. Ensure events table has certificates_released_at column
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS certificates_released_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Ensure certificate_templates table exists and has required columns
CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT,
  storage_path TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('solo', 'team')),
  certificate_type TEXT CHECK (certificate_type IS NULL OR certificate_type IN ('Participation', 'Winner', 'Runner Up', '2nd Runner Up', 'Special Mention')),
  layout_config JSONB,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.certificate_templates
  ADD COLUMN IF NOT EXISTS certificate_type TEXT,
  ADD COLUMN IF NOT EXISTS layout_config JSONB;

-- 3. Ensure certificate_assignments table exists and has required columns
CREATE TABLE IF NOT EXISTS public.certificate_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  team_member_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.certificate_templates(id) ON DELETE SET NULL,
  certificate_type TEXT NOT NULL DEFAULT 'Participation',
  certificate_file_url TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.certificate_assignments
  ADD COLUMN IF NOT EXISTS certificate_file_url TEXT DEFAULT NULL;

-- 4. Ensure legacy certificates table exists
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  team_member_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE,
  certificate_url TEXT NOT NULL,
  template_version INT DEFAULT 1,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Drop legacy unique constraints on certificate_templates to support multi-type templates
ALTER TABLE public.certificate_templates
  DROP CONSTRAINT IF EXISTS certificate_templates_event_template_type_key,
  DROP CONSTRAINT IF EXISTS certificate_templates_event_type_key,
  DROP CONSTRAINT IF EXISTS certificates_templates_event_type_key;

DROP INDEX IF EXISTS public.certificate_templates_event_template_type_key;
DROP INDEX IF EXISTS public.certificate_templates_event_type_key;
DROP INDEX IF EXISTS public.certificates_templates_event_type_key;

-- 6. Add partial unique indexes for certificate_templates and certificate_assignments
CREATE UNIQUE INDEX IF NOT EXISTS idx_cert_templates_event_type_template
  ON public.certificate_templates (event_id, certificate_type, template_type)
  WHERE certificate_type IS NOT NULL AND template_type IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ca_solo_event_reg_unique
  ON public.certificate_assignments (event_id, registration_id)
  WHERE team_member_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ca_member_event_reg_unique
  ON public.certificate_assignments (event_id, registration_id, team_member_id)
  WHERE team_member_id IS NOT NULL;

-- 7. Enable RLS and add public SELECT policies
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'certificate_assignments' AND policyname = 'Public select certificate_assignments'
  ) THEN
    CREATE POLICY "Public select certificate_assignments" ON public.certificate_assignments FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'certificate_templates' AND policyname = 'Public select certificate_templates'
  ) THEN
    CREATE POLICY "Public select certificate_templates" ON public.certificate_templates FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'certificates' AND policyname = 'Public select certificates'
  ) THEN
    CREATE POLICY "Public select certificates" ON public.certificates FOR SELECT USING (true);
  END IF;
END $$;

-- 8. Storage bucket 'certificates' setup
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO UPDATE SET public = true;
