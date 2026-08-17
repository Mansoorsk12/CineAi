CREATE TABLE IF NOT EXISTS public.tmdb_releases (
  tmdb_id integer PRIMARY KEY,
  release_type text NOT NULL CHECK (release_type IN ('theatre','ott')),
  title text NOT NULL,
  release_date date,
  rating numeric NOT NULL DEFAULT 0,
  genres text[] NOT NULL DEFAULT '{}',
  language text NOT NULL DEFAULT '',
  overview text NOT NULL DEFAULT '',
  poster_path text,
  backdrop_path text,
  trailer_key text,
  imdb_id text,
  runtime integer,
  director text,
  cast_members jsonb NOT NULL DEFAULT '[]'::jsonb,
  providers jsonb NOT NULL DEFAULT '[]'::jsonb,
  hidden boolean NOT NULL DEFAULT false,
  featured boolean NOT NULL DEFAULT false,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.tmdb_releases TO anon;
GRANT SELECT ON public.tmdb_releases TO authenticated;
GRANT ALL ON public.tmdb_releases TO service_role;

ALTER TABLE public.tmdb_releases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view visible releases" ON public.tmdb_releases;
CREATE POLICY "Anyone can view visible releases"
  ON public.tmdb_releases FOR SELECT
  TO anon, authenticated
  USING (hidden = false);

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;