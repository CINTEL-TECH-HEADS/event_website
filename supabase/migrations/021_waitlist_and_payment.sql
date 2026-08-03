-- 021_waitlist_and_payment.sql
-- Optional per-event waitlist cap + paid-event fee, and per-registration payment
-- and waitlist-offer state. Real payment gateway is deferred (simulated for now).

-- Events: optional waitlist size (null = no waitlist → close when capacity full)
-- and an optional fee in rupees (0 = free).
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS waitlist_capacity int;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS fee int NOT NULL DEFAULT 0;

-- Registrations: payment lifecycle and waitlist-offer lifecycle.
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'not_required';
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS offer_status text NOT NULL DEFAULT 'none';

ALTER TABLE public.registrations DROP CONSTRAINT IF EXISTS registrations_payment_status_check;
ALTER TABLE public.registrations
  ADD CONSTRAINT registrations_payment_status_check
  CHECK (payment_status IN ('not_required', 'pending', 'paid'));

ALTER TABLE public.registrations DROP CONSTRAINT IF EXISTS registrations_offer_status_check;
ALTER TABLE public.registrations
  ADD CONSTRAINT registrations_offer_status_check
  CHECK (offer_status IN ('none', 'offered', 'accepted', 'declined'));
