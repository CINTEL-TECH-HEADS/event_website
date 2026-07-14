-- 013_audit_log.sql
-- Records of organizer actions (create/edit/delete events, check-ins, cancellations, etc.)

CREATE TABLE IF NOT EXISTS public.audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  action      text NOT NULL,
  target_type text,
  target_id   uuid,
  event_id    uuid REFERENCES public.events(id) ON DELETE SET NULL,
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_event  ON public.audit_log (event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor  ON public.audit_log (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_log (action, created_at DESC);

-- RLS on with no policies → only the service-role (admin) client can read/write.
-- Writes happen via lib/audit; reads via /api/audit after a superadmin check.
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
