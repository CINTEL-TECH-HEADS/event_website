-- 019_certificate_image_system.sql
-- ADDITIVE ONLY — adds columns and indexes needed by the new image-based
-- certificate generator. Does NOT recreate or drop any existing table.
--
-- certificate_templates gains:
--   certificate_type  — maps this template to a specific award type
--                       (Participation, Winner, etc.)
--   layout_config     — JSONB positioning for Name, Team Name, QR on the image
--
-- certificate_assignments gains:
--   Two partial unique indexes for reliable ON CONFLICT upsert:
--   • solo:  (event_id, registration_id) WHERE team_member_id IS NULL
--   • team:  (event_id, registration_id, team_member_id) WHERE team_member_id IS NOT NULL

-- ── certificate_templates extensions ──────────────────────────────────────────

ALTER TABLE public.certificate_templates
  ADD COLUMN IF NOT EXISTS certificate_type TEXT
  CHECK (certificate_type IS NULL OR certificate_type = ANY (ARRAY[
    'Participation'::text,
    'Winner'::text,
    'Runner Up'::text,
    '2nd Runner Up'::text,
    'Special Mention'::text
  ]));

-- layout_config stores JSON like:
-- {
--   "name":     { "x": 0.5, "y": 0.52, "fontSize": 54, "fontFamily": "Arial",
--                 "fontWeight": "bold", "textAlign": "center", "maxWidth": 0.7,
--                 "color": "#1a1a1a" },
--   "teamName": { "x": 0.5, "y": 0.62, "fontSize": 30, "fontFamily": "Arial",
--                 "fontWeight": "normal", "textAlign": "center", "maxWidth": 0.6,
--                 "color": "#333333" },
--   "qr":       { "x": 0.88, "y": 0.82, "size": 120 }
-- }
-- All x/y are fractions of the original image width/height (0.0 – 1.0).
-- maxWidth is a fraction of image width. size is px at the original image resolution.

ALTER TABLE public.certificate_templates
  ADD COLUMN IF NOT EXISTS layout_config JSONB;

-- ── certificate_assignments unique indexes ────────────────────────────────────

-- Solo: one assignment row per registration per event (team_member_id is NULL)
CREATE UNIQUE INDEX IF NOT EXISTS ca_solo_event_reg_unique
  ON public.certificate_assignments (event_id, registration_id)
  WHERE team_member_id IS NULL;

-- Team member: one assignment row per (event, registration, member)
CREATE UNIQUE INDEX IF NOT EXISTS ca_member_event_reg_unique
  ON public.certificate_assignments (event_id, registration_id, team_member_id)
  WHERE team_member_id IS NOT NULL;
