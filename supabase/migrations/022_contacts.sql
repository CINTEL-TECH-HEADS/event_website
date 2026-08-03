-- 022_contacts.sql
-- Public "Contact Us" directory. Contacts are org-wide (not per-event), managed
-- by organizers through the dashboard and shown on the public /contact page.
-- Routes self-authorize via the admin client, so no RLS is required here.

CREATE TABLE IF NOT EXISTS public.contacts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  designation  text NOT NULL,
  email        text,
  phone        text,
  sort_order   int  NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);
