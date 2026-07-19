-- Migration: 005_registrations
-- Owner: BE1
-- NOTE: No OTP column — check-in is QR-only (UUID-based)

CREATE TABLE IF NOT EXISTS registrations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id          TEXT NOT NULL,               -- short 8-char human-readable ID
  event_id            UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  registration_type   TEXT NOT NULL CHECK (registration_type IN ('solo', 'team')),
  team_name           TEXT,
  leader_name         TEXT NOT NULL,
  leader_email        TEXT NOT NULL,
  leader_phone        TEXT NOT NULL,
  qr_code_url         TEXT,                        -- path in Supabase Storage (qrcodes bucket)
  status              TEXT NOT NULL DEFAULT 'confirmed'
                        CHECK (status IN ('confirmed', 'waitlisted', 'cancelled')),
  waitlist_position   INT,
  registered_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent same email registering twice for the same event
  CONSTRAINT registrations_unique_email_event UNIQUE (leader_email, event_id)
);

ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
