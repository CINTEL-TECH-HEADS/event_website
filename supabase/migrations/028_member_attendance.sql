-- 028_member_attendance.sql
-- Per-member attendance for team registrations. A team shares one QR pass and
-- one `attendance` row, but not everyone may turn up, so each member now has
-- their own check-in time. Rule: a team has an attendance row if and only if at
-- least one member is present. Solo registrations are unchanged.

ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz;

ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS checked_in_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Until now a team check-in meant the whole team was present.
UPDATE public.team_members tm
SET checked_in_at = a.checked_in_at,
    checked_in_by = a.checked_in_by
FROM public.attendance a
WHERE a.registration_id = tm.registration_id
  AND tm.checked_in_at IS NULL;
