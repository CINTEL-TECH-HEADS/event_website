-- 012_participant_role.sql
-- Adds a 'participant' role and makes it the default for new signups.
-- Before this, profiles.role defaulted to 'organizer' and only allowed
-- ('superadmin','organizer'), so every new auth user became an organizer.

-- 1. Allow the 'participant' role
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('superadmin', 'organizer', 'participant'));

-- 2. New signups are participants by default (organizers are created manually)
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'participant';

-- 3. Trigger sets the role explicitly so it never silently falls back to organizer
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    'participant'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;
