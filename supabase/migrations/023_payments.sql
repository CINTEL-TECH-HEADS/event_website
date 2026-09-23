-- 023_payments.sql
-- Manual payment-verification layer. Organizers publish a single active payment
-- method (UPI id or bank transfer) per paid event; participants pay externally
-- and submit proof (transaction/UTR + method-specific field + screenshot); an
-- organizer verifies each transaction in the Payments tab and grants the pass.
-- No real gateway/money movement — manual reconciliation only.

-- ── Event payment configuration (only meaningful when fee > 0) ──
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS payment_method       text; -- 'upi' | 'bank' | null
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS upi_id               text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS upi_payee_name       text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS bank_account_name    text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS bank_account_number  text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS bank_ifsc            text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS bank_name            text;

ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_payment_method_check;
ALTER TABLE public.events
  ADD CONSTRAINT events_payment_method_check
  CHECK (payment_method IS NULL OR payment_method IN ('upi', 'bank'));

-- ── Widen registration payment lifecycle with review states ──
--   pending   = owes payment, no proof yet
--   submitted = proof submitted, awaiting organizer verification
--   paid      = verified, pass issued
--   rejected  = organizer rejected the proof (participant may resubmit)
ALTER TABLE public.registrations DROP CONSTRAINT IF EXISTS registrations_payment_status_check;
ALTER TABLE public.registrations
  ADD CONSTRAINT registrations_payment_status_check
  CHECK (payment_status IN ('not_required', 'pending', 'submitted', 'paid', 'rejected'));

-- ── Payment proof submissions (keeps a resubmission trail) ──
CREATE TABLE IF NOT EXISTS public.payment_submissions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id  uuid NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  event_id         uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  method           text NOT NULL CHECK (method IN ('upi', 'bank')),
  payer_upi_id     text,              -- UPI method: payer VPA
  transaction_id   text,              -- UPI reference / bank UTR
  payee_name       text,              -- bank method: account-holder name
  amount           int  NOT NULL DEFAULT 0,
  screenshot_path  text,              -- path in the private 'uploads' bucket
  status           text NOT NULL DEFAULT 'submitted'
                     CHECK (status IN ('submitted', 'verified', 'rejected')),
  note             text,              -- organizer note / rejection reason
  reviewed_by      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_submissions_event_status_idx
  ON public.payment_submissions (event_id, status);
CREATE INDEX IF NOT EXISTS payment_submissions_registration_idx
  ON public.payment_submissions (registration_id, created_at DESC);
