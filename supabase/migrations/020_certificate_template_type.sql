-- 020_certificate_template_type.sql
-- ADDITIVE ONLY — adds template_type column and updates the certificate_type
-- check constraint to remove 'Special Mention'.
--
-- Changes:
-- 1. Add template_type column to certificate_templates (solo / team)
-- 2. Drop old certificate_type check constraint
-- 3. Add new certificate_type check constraint without 'Special Mention'
-- 4. Add template_type check constraint

-- ── 1. Add template_type column ───────────────────────────────────────────────

ALTER TABLE public.certificate_templates
  ADD COLUMN IF NOT EXISTS template_type TEXT
  CHECK (template_type IS NULL OR template_type IN ('solo', 'team'));

-- ── 2. Drop old certificate_type check constraint ──────────────────────────────

ALTER TABLE public.certificate_templates
  DROP CONSTRAINT IF EXISTS certificate_templates_certificate_type_check;

-- ── 3. Add new certificate_type check constraint (without 'Special Mention') ──

ALTER TABLE public.certificate_templates
  ADD CONSTRAINT certificate_templates_certificate_type_check
  CHECK (certificate_type IS NULL OR certificate_type = ANY (ARRAY[
    'Participation'::text,
    'Winner'::text,
    'Runner Up'::text,
    '2nd Runner Up'::text
  ]));

-- ── 4. Add unique index for (event_id, certificate_type, template_type) ───────

CREATE UNIQUE INDEX IF NOT EXISTS idx_cert_templates_event_type_template
  ON public.certificate_templates (event_id, certificate_type, template_type)
  WHERE certificate_type IS NOT NULL AND template_type IS NOT NULL;
