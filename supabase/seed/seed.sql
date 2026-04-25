-- supabase/seed/seed.sql
-- Dev seed data for testing all API routes.
-- Run this in Supabase SQL editor AFTER running all migrations.
--
-- What this creates:
--   2 organizer profiles (you'll link these to real auth users below)
--   2 events (1 published workshop, 1 draft hackathon)
--   form fields for each event
--   2 registrations (1 solo, 1 team)
--   team members for the team registration
--   form answers
--   1 attendance record
--   1 duplicate flag
--   1 notification log entry
--   1 certificate record
--
-- ⚠  BEFORE RUNNING:
--    Replace the two UUIDs below with real auth user IDs from your
--    Supabase Auth dashboard (Authentication → Users → copy the UUID).
--
--    ORGANIZER_1_UUID = the account you created for yourself
--    ORGANIZER_2_UUID = create a second test user in Auth dashboard

-- ── 0. Config — replace these with real auth user UUIDs ──────

DO $$
DECLARE
  org1_id   UUID := '7846210a-1807-44af-9a3a-e2b844dfdaf3';
  org2_id   UUID := 'e8ec8c38-746a-473d-bf7a-29846e86de92';

  event1_id UUID := gen_random_uuid();
  event2_id UUID := gen_random_uuid();

  field1_id UUID := gen_random_uuid();
  field2_id UUID := gen_random_uuid();
  field3_id UUID := gen_random_uuid();
  field4_id UUID := gen_random_uuid();

  reg1_id   UUID := gen_random_uuid();
  reg2_id   UUID := gen_random_uuid();

  member1_id UUID := gen_random_uuid();
  member2_id UUID := gen_random_uuid();
  member3_id UUID := gen_random_uuid();

BEGIN

-- ── 1. Profiles ───────────────────────────────────────────────
INSERT INTO profiles (id, full_name, email, role) VALUES
  (org1_id, 'Prathamesh Dev',  'prathamesh@cintel.in', 'organizer'),
  (org2_id, 'Test Organizer',  'test@cintel.in',       'organizer')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email     = EXCLUDED.email;

-- ── 2. Events ────────────────────────────────────────────────
INSERT INTO events (
  id, title, description, event_type, venue,
  starts_at, ends_at, registration_closes_at,
  capacity, registration_mode, slug, is_published, created_by
) VALUES
(
  event1_id,
  'Web Dev Workshop',
  'A hands-on workshop covering React and Next.js fundamentals.',
  'workshop',
  'Lab 4, SRM Institute of Science and Technology',
  NOW() + INTERVAL '7 days',
  NOW() + INTERVAL '7 days' + INTERVAL '4 hours',
  NOW() + INTERVAL '6 days',
  50,
  'solo',
  'web-dev-workshop-2026',
  TRUE,
  org1_id
),
(
  event2_id,
  'Cintel Hackathon 2026',
  '24-hour hackathon. Build something awesome.',
  'hackathon',
  'Main Auditorium, SRM',
  NOW() + INTERVAL '14 days',
  NOW() + INTERVAL '15 days',
  NOW() + INTERVAL '12 days',
  100,
  'team',
  'cintel-hackathon-2026',
  FALSE,   -- draft, not published yet
  org1_id
);

-- ── 3. Event organizers ───────────────────────────────────────
INSERT INTO event_organizers (event_id, profile_id, role) VALUES
  (event1_id, org1_id, 'owner'),
  (event2_id, org1_id, 'owner'),
  (event1_id, org2_id, 'sub_admin');

-- ── 4. Form fields ────────────────────────────────────────────
-- Workshop fields
INSERT INTO form_fields (
  id, event_id, label, field_type, is_required, applies_to, sort_order
) VALUES
(
  field1_id, event1_id,
  'What is your year of study?',
  'select',
  TRUE, 'registration', 1
),
(
  field2_id, event1_id,
  'Have you used React before?',
  'checkbox',
  FALSE, 'registration', 2
);

-- Update field1 options
UPDATE form_fields
SET options = '["1st Year", "2nd Year", "3rd Year", "4th Year"]'::jsonb
WHERE id = field1_id;

-- Hackathon fields
INSERT INTO form_fields (
  id, event_id, label, field_type, is_required, applies_to, sort_order
) VALUES
(
  field3_id, event2_id,
  'Team name',
  'text',
  TRUE, 'registration', 1
),
(
  field4_id, event2_id,
  'GitHub profile URL',
  'text',
  FALSE, 'member', 1
);

-- ── 5. Registrations ──────────────────────────────────────────
INSERT INTO registrations (
  id, display_id, event_id, registration_type,
  leader_name, leader_email, leader_phone,
  status, registered_at
) VALUES
(
  reg1_id,
  'A3F2K9M1',
  event1_id,
  'solo',
  'Rahul Sharma',
  'rahul@example.com',
  '9876543210',
  'confirmed',
  NOW() - INTERVAL '2 days'
);

-- Team registration for hackathon
INSERT INTO registrations (
  id, display_id, event_id, registration_type,
  team_name, leader_name, leader_email, leader_phone,
  status, registered_at
) VALUES
(
  reg2_id,
  'B7X1P4Q2',
  event2_id,
  'team',
  'Team Alpha',
  'Priya Nair',
  'priya@example.com',
  '9123456780',
  'confirmed',
  NOW() - INTERVAL '1 day'
);

-- ── 6. Team members ───────────────────────────────────────────
INSERT INTO team_members (id, registration_id, full_name, email, is_leader) VALUES
  (member1_id, reg2_id, 'Priya Nair',   'priya@example.com',  TRUE),
  (member2_id, reg2_id, 'Arjun Kumar',  'arjun@example.com',  FALSE),
  (member3_id, reg2_id, 'Sneha Reddy',  'sneha@example.com',  FALSE);

-- ── 7. Registration answers ───────────────────────────────────
INSERT INTO registration_answers (registration_id, field_id, answer) VALUES
  (reg1_id, field1_id, '2nd Year'),
  (reg1_id, field2_id, 'true');

-- ── 8. Attendance ─────────────────────────────────────────────
INSERT INTO attendance (registration_id, event_id, method, checked_in_by) VALUES
  (reg1_id, event1_id, 'qr_scan', org1_id);

-- ── 9. Duplicate flags ────────────────────────────────────────
INSERT INTO duplicate_flags (event_id, registration_id, reason) VALUES
  (event1_id, reg1_id, 'rapid_submission');

-- ── 10. Notifications log ─────────────────────────────────────
INSERT INTO notifications_log (
  event_id, registration_id, type, channel, status, sent_at
) VALUES
  (event1_id, reg1_id, 'confirmation', 'email', 'sent', NOW() - INTERVAL '2 days');

-- ── 11. Certificates ─────────────────────────────────────────
INSERT INTO certificates (
  event_id, registration_id, certificate_url, template_version
) VALUES
  (event1_id, reg1_id, 'generated/test-cert.pdf', 1);
END $$;