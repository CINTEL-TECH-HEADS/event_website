-- 031_harden_functions.sql
-- Security Advisor warnings on the three SECURITY DEFINER functions in public:
--   * no fixed search_path (a caller could shadow tables/functions they use)
--   * executable by anon and authenticated, i.e. callable by anyone through
--     /rest/v1/rpc. schedule_notification_job creates or deletes pg_cron jobs
--     that POST to any URL; decrement_waitlist_positions reorders any event's
--     waitlist. Neither app calls them, and handle_new_user is a trigger.
-- Pin search_path and let only the server (service_role) execute them.
-- Triggers don't need EXECUTE, so new sign-ups still get a profile.

ALTER FUNCTION public.handle_new_user()                                   SET search_path = public;
ALTER FUNCTION public.decrement_waitlist_positions(uuid)                  SET search_path = public;
ALTER FUNCTION public.schedule_notification_job(text, text, uuid, text)   SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.handle_new_user()                                 FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrement_waitlist_positions(uuid)                FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.schedule_notification_job(text, text, uuid, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.decrement_waitlist_positions(uuid)                TO service_role;
GRANT EXECUTE ON FUNCTION public.schedule_notification_job(text, text, uuid, text) TO service_role;
