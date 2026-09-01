
CREATE TABLE public.media_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tmdb_id integer NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('movie','tv')),
  title text NOT NULL,
  original_title text,
  overview text NOT NULL DEFAULT '',
  poster_path text,
  backdrop_path text,
  release_date date,
  year integer,
  runtime integer,
  genres text[] NOT NULL DEFAULT '{}',
  language text NOT NULL DEFAULT 'Other',
  language_code text NOT NULL DEFAULT '',
  country text,
  industry text NOT NULL DEFAULT 'International',
  rating numeric NOT NULL DEFAULT 0,
  vote_count integer NOT NULL DEFAULT 0,
  popularity numeric NOT NULL DEFAULT 0,
  imdb_id text,
  trailer_key text,
  director text,
  cast_members jsonb NOT NULL DEFAULT '[]'::jsonb,
  seasons integer,
  episodes integer,
  status text,
  source text NOT NULL DEFAULT 'sync',
  featured boolean NOT NULL DEFAULT false,
  hidden boolean NOT NULL DEFAULT false,
  first_imported_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT media_items_tmdb_unique UNIQUE (media_type, tmdb_id)
);

CREATE INDEX media_items_language_idx ON public.media_items (language);
CREATE INDEX media_items_industry_idx ON public.media_items (industry);
CREATE INDEX media_items_type_idx ON public.media_items (media_type);
CREATE INDEX media_items_release_idx ON public.media_items (release_date DESC);
CREATE INDEX media_items_popularity_idx ON public.media_items (popularity DESC);
CREATE INDEX media_items_imported_idx ON public.media_items (first_imported_at DESC);
CREATE INDEX media_items_title_idx ON public.media_items USING gin (to_tsvector('simple', title || ' ' || coalesce(original_title,'')));

GRANT SELECT ON public.media_items TO anon;
GRANT SELECT ON public.media_items TO authenticated;
GRANT ALL ON public.media_items TO service_role;

ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible media" ON public.media_items
  FOR SELECT TO anon, authenticated USING (hidden = false);
CREATE POLICY "Admins can view all media" ON public.media_items
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert media" ON public.media_items
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update media" ON public.media_items
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete media" ON public.media_items
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.media_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query_title text NOT NULL,
  media_type text NOT NULL DEFAULT 'movie' CHECK (media_type IN ('movie','tv')),
  tmdb_id integer,
  imdb_id text,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','approved','rejected')),
  verified_title text,
  verified_poster_path text,
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX media_requests_user_idx ON public.media_requests (user_id, created_at DESC);
CREATE INDEX media_requests_status_idx ON public.media_requests (status, created_at DESC);

GRANT SELECT, INSERT ON public.media_requests TO authenticated;
GRANT UPDATE, DELETE ON public.media_requests TO authenticated;
GRANT ALL ON public.media_requests TO service_role;

ALTER TABLE public.media_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests" ON public.media_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own requests" ON public.media_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all requests" ON public.media_requests
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update requests" ON public.media_requests
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete requests" ON public.media_requests
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode text NOT NULL DEFAULT 'daily',
  status text NOT NULL DEFAULT 'running',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  checked integer NOT NULL DEFAULT 0,
  added integer NOT NULL DEFAULT 0,
  updated integer NOT NULL DEFAULT 0,
  skipped integer NOT NULL DEFAULT 0,
  failed integer NOT NULL DEFAULT 0,
  errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  triggered_by text NOT NULL DEFAULT 'cron',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sync_logs_started_idx ON public.sync_logs (started_at DESC);

GRANT SELECT ON public.sync_logs TO authenticated;
GRANT ALL ON public.sync_logs TO service_role;

ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view sync logs" ON public.sync_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $fn$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$fn$;

CREATE TRIGGER media_items_updated_at BEFORE UPDATE ON public.media_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER media_requests_updated_at BEFORE UPDATE ON public.media_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'mansoorsk115@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT cron.unschedule('cineai-daily-tmdb-sync') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cineai-daily-tmdb-sync'
);

SELECT cron.schedule(
  'cineai-daily-tmdb-sync',
  '15 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--e30d8cd7-2ddc-414b-8025-0d278ce32b17.lovable.app/api/public/cron/tmdb-sync',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"mode":"daily","triggered_by":"cron"}'::jsonb
  );
  $$
);
