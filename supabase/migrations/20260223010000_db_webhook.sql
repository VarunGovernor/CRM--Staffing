-- DB Webhook: trigger Edge Function on notifications INSERT via pg_net
-- Note: pg_net extension must be enabled (done via Supabase Dashboard or SQL below)
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.notify_push_on_notification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $func$
DECLARE svc_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6dmJiemJwanVja2F3amlqaXpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDIzNjc3NCwiZXhwIjoyMDg1ODEyNzc0fQ.6YtnpX3eChCo_JswOS0PSmTd_zw348PoCrTliYJJAC0';
BEGIN
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

DROP TRIGGER IF EXISTS on_notification_insert ON public.notifications;
CREATE TRIGGER on_notification_insert
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_push_on_notification();
