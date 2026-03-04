-- ================================================================
-- Security Fix: Remove hardcoded service_role JWT from DB trigger
--
-- The old trigger (20260223010000_db_webhook.sql) embedded the
-- service_role key as a plaintext string inside a PL/pgSQL function.
-- Anyone with access to pg_proc, the migration file, or DB logs
-- could read the key and bypass ALL RLS policies.
--
-- New approach: the key is read from a Postgres configuration
-- parameter (app.supabase_service_key) that must be set once by
-- an admin in the Supabase SQL editor:
--
--   ALTER DATABASE postgres
--     SET "app.supabase_service_key" = '<your-service-role-key>';
--
-- The function returns NULL (no-op) if the setting is missing,
-- so push notifications degrade gracefully instead of using a
-- stale/compromised key.
-- ================================================================

CREATE OR REPLACE FUNCTION public.notify_push_on_notification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $func$
DECLARE
  svc_key text;
BEGIN
  -- Read key from DB config — never hardcode secrets in migration files.
  svc_key := current_setting('app.supabase_service_key', true);

  -- If the setting has not been configured, skip silently (fail-safe).
  IF svc_key IS NULL OR svc_key = '' THEN
    RAISE WARNING 'notify_push_on_notification: app.supabase_service_key is not set. Push notification skipped.';
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url     => 'https://wzvbbzbpjuckawjijizq.supabase.co/functions/v1/send-push-notification',
    headers => jsonb_build_object(
                 'Content-Type',  'application/json',
                 'Authorization', 'Bearer ' || svc_key
               ),
    body    => to_jsonb(NEW)
  );
  RETURN NEW;
END;
$func$;
