-- 027_form_field_audience.sql
-- Separate registration forms for events open to other colleges. Each custom
-- field belongs to one form: 'srm' (SRM KTR students) or 'external' (students
-- from other colleges). Existing fields are the SRM form.

ALTER TABLE public.form_fields
  ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'srm';

ALTER TABLE public.form_fields DROP CONSTRAINT IF EXISTS form_fields_audience_check;
ALTER TABLE public.form_fields
  ADD CONSTRAINT form_fields_audience_check CHECK (audience IN ('srm', 'external'));
