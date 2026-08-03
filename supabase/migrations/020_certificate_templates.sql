-- 020_certificate_templates.sql
-- Multiple named certificate templates per event (e.g. "Winner", "Participant"),
-- with per-attendee assignment. Unassigned attendees fall back to the default
-- template. The legacy single template at templates/<eventId>.pdf still works.

CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name         text NOT NULL,
  storage_path text NOT NULL,
  is_default   boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS certificate_templates_event_idx
  ON public.certificate_templates (event_id);

-- Which template a specific attendee (per-member for teams) should receive.
CREATE TABLE IF NOT EXISTS public.certificate_assignments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  registration_id uuid NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  team_member_id  uuid REFERENCES public.team_members(id) ON DELETE CASCADE,
  template_id     uuid NOT NULL REFERENCES public.certificate_templates(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- One assignment per attendee (solo = registration; team = per member).
CREATE UNIQUE INDEX IF NOT EXISTS certificate_assignments_reg_member_key
  ON public.certificate_assignments (registration_id, team_member_id)
  WHERE team_member_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS certificate_assignments_reg_solo_key
  ON public.certificate_assignments (registration_id)
  WHERE team_member_id IS NULL;

ALTER TABLE public.certificate_templates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_assignments  ENABLE ROW LEVEL SECURITY;
-- Routes use the admin client + requireOrganizerRole; RLS is a backstop (no public policies).
