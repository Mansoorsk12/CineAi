CREATE TABLE IF NOT EXISTS public.app_secrets (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.app_secrets TO service_role;
ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;

INSERT INTO public.app_secrets (key, value)
VALUES ('cron_token', replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''))
ON CONFLICT (key) DO NOTHING;

DO $$
DECLARE
  tok text;
BEGIN
  SELECT value INTO tok FROM public.app_secrets WHERE key = 'cron_token';

  PERFORM cron.unschedule(jobid) FROM cron.job WHERE command LIKE '%tmdb-sync%';

  PERFORM cron.schedule(
    'tmdb-daily-sync',
    '15 2 * * *',
    format($cmd$
      SELECT net.http_post(
        url := 'https://project--e30d8cd7-2ddc-414b-8025-0d278ce32b17.lovable.app/api/public/cron/tmdb-sync',
        headers := %L::jsonb,
        body := '{"mode":"daily","triggered_by":"cron"}'::jsonb
      );
    $cmd$, json_build_object('Content-Type', 'application/json', 'x-cron-token', tok)::text)
  );
END $$;