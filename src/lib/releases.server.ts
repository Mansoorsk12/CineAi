/**
 * Server-only TMDB release feed.
 *
 * Reuses the existing TMDB_API_KEY. Results are cached in `tmdb_releases` and
 * only refreshed when the cache is older than 24h (or an admin forces it), so
 * page loads never hit TMDB.
 */
import type { CastMember } from "@/data/tmdb-types";
import type { ReleaseItem, ReleaseProvider, ReleaseType } from "./releases-shared";

const API = "https://api.themoviedb.org/3";
const DAY_MS = 24 * 60 * 60 * 1000;
const PER_TYPE = 20;

type Row = {
  tmdb_id: number;
  release_type: string;
  title: string;
  release_date: string | null;
  rating: number | string;
  genres: string[] | null;
  language: string | null;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  trailer_key: string | null;
  imdb_id: string | null;
  runtime: number | null;
  director: string | null;
  cast_members: unknown;
  providers: unknown;
  hidden: boolean;
  featured: boolean;
  created_at: string;
};

export const rowToItem = (r: Row): ReleaseItem => ({
  tmdbId: r.tmdb_id,
  releaseType: (r.release_type === "ott" ? "ott" : "theatre") as ReleaseType,
  title: r.title,
  releaseDate: r.release_date,
  rating: Number(r.rating ?? 0),
  genres: r.genres ?? [],
  language: r.language ?? "",
  overview: r.overview ?? "",
  posterPath: r.poster_path,
  backdropPath: r.backdrop_path,
  trailerKey: r.trailer_key,
  imdbId: r.imdb_id,
  runtime: r.runtime,
  director: r.director,
  cast: (r.cast_members as CastMember[] | null) ?? [],
  providers: (r.providers as ReleaseProvider[] | null) ?? [],
  featured: r.featured,
  hidden: r.hidden,
  createdAt: r.created_at,
});

const iso = (d: Date) => d.toISOString().slice(0, 10);

async function tmdb<T>(path: string, params: Record<string, string> = {}): Promise<T | null> {
  const key = process.env["TMDB_API_KEY"];
  if (!key) return null;
  const url = new URL(`${API}${path}`);
  url.searchParams.set("api_key", key);
  url.searchParams.set("language", "en-US");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  if (!res.ok) return null;
  return (await res.json()) as T;
}

interface Brief {
  id: number;
  title?: string;
  release_date?: string;
}

const LANGS: Record<string, string> = {
  en: "English",
  te: "Telugu",
  hi: "Hindi",
  ta: "Tamil",
  ml: "Malayalam",
  kn: "Kannada",
  bn: "Bengali",
  mr: "Marathi",
  ja: "Japanese",
  ko: "Korean",
  es: "Spanish",
  fr: "French",
  de: "German",
  zh: "Chinese",
};

async function detail(id: number, type: ReleaseType): Promise<Omit<ReleaseItem, "featured"> | null> {
  const d = await tmdb<any>(`/movie/${id}`, {
    append_to_response: "videos,credits,watch/providers,external_ids",
  });
  if (!d || !d.title) return null;

  const videos: any[] = d.videos?.results ?? [];
  const trailer =
    videos.find((v) => v.site === "YouTube" && v.type === "Trailer" && /official/i.test(v.name ?? "")) ??
    videos.find((v) => v.site === "YouTube" && v.type === "Trailer") ??
    videos.find((v) => v.site === "YouTube" && v.type === "Teaser");

  const flat: any = d["watch/providers"]?.results ?? {};
  const region = flat["IN"] ?? flat["US"] ?? {};
  const seen = new Set<string>();
  const providers: ReleaseProvider[] = [...(region.flatrate ?? []), ...(region.rent ?? [])]
    .filter((p: any) => (seen.has(p.provider_name) ? false : seen.add(p.provider_name)))
    .slice(0, 3)
    .map((p: any) => ({ name: p.provider_name as string, logoPath: (p.logo_path as string) ?? null }));

  const cast: CastMember[] = (d.credits?.cast ?? []).slice(0, 12).map((c: any) => ({
    name: c.name,
    character: c.character || null,
    profilePath: c.profile_path ?? null,
  }));

  return {
    tmdbId: d.id,
    releaseType: type,
    title: d.title,
    releaseDate: d.release_date || null,
    rating: Number(d.vote_average ?? 0),
    genres: (d.genres ?? []).map((g: any) => g.name as string),
    language: LANGS[d.original_language] ?? String(d.original_language ?? "").toUpperCase(),
    overview: d.overview ?? "",
    posterPath: d.poster_path ?? null,
    backdropPath: d.backdrop_path ?? null,
    trailerKey: trailer?.key ?? null,
    imdbId: d.imdb_id || d.external_ids?.imdb_id || null,
    runtime: d.runtime ?? null,
    director: (d.credits?.crew ?? []).find((c: any) => c.job === "Director")?.name ?? null,
    cast,
    providers,
  };
}

/** Fetches fresh theatre + digital releases from TMDB and upserts the cache. */
export async function refreshReleaseCache(): Promise<number> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const today = new Date();
  const from = iso(new Date(today.getTime() - 60 * DAY_MS));
  const to = iso(today);

  const theatreLists = await Promise.all([
    tmdb<{ results: Brief[] }>("/movie/now_playing", { region: "IN", page: "1" }),
    tmdb<{ results: Brief[] }>("/movie/now_playing", { region: "US", page: "1" }),
  ]);
  const ottLists = await Promise.all([
    tmdb<{ results: Brief[] }>("/discover/movie", {
      with_release_type: "4",
      "release_date.gte": from,
      "release_date.lte": to,
      sort_by: "primary_release_date.desc",
      "vote_count.gte": "5",
      watch_region: "IN",
      page: "1",
    }),
    tmdb<{ results: Brief[] }>("/discover/movie", {
      with_release_type: "4",
      "primary_release_date.gte": from,
      "primary_release_date.lte": to,
      sort_by: "popularity.desc",
      watch_region: "US",
      page: "1",
    }),
  ]);

  const theatreIds: number[] = [];
  for (const l of theatreLists) for (const r of l?.results ?? []) theatreIds.push(r.id);
  const ottIds: number[] = [];
  for (const l of ottLists) for (const r of l?.results ?? []) ottIds.push(r.id);

  const chosen = new Map<number, ReleaseType>();
  for (const id of theatreIds) if (chosen.size < PER_TYPE) chosen.set(id, "theatre");
  let ottCount = 0;
  for (const id of ottIds) {
    if (chosen.has(id) || ottCount >= PER_TYPE) continue;
    chosen.set(id, "ott");
    ottCount += 1;
  }
  if (!chosen.size) return 0;

  const details = await Promise.all([...chosen].map(([id, type]) => detail(id, type)));
  const rows = details
    .filter((d): d is Omit<ReleaseItem, "featured"> => Boolean(d && d.posterPath))
    .map((d) => ({
      tmdb_id: d.tmdbId,
      release_type: d.releaseType,
      title: d.title,
      release_date: d.releaseDate,
      rating: d.rating,
      genres: d.genres,
      language: d.language,
      overview: d.overview,
      poster_path: d.posterPath,
      backdrop_path: d.backdropPath,
      trailer_key: d.trailerKey,
      imdb_id: d.imdbId,
      runtime: d.runtime,
      director: d.director,
      cast_members: d.cast as unknown as import("@/integrations/supabase/types").Json,
      providers: d.providers as unknown as import("@/integrations/supabase/types").Json,
      fetched_at: new Date().toISOString(),
    }));
  if (!rows.length) return 0;

  const { error } = await supabaseAdmin.from("tmdb_releases").upsert(rows, { onConflict: "tmdb_id" });
  if (error) throw new Error(error.message);
  return rows.length;
}

/** Cached releases; refreshes at most once a day (or when forced). */
export async function loadReleases(opts: { force?: boolean; includeHidden?: boolean } = {}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: newest } = await supabaseAdmin
    .from("tmdb_releases")
    .select("fetched_at")
    .order("fetched_at", { ascending: false })
    .limit(1);

  const last = newest?.[0]?.fetched_at ? new Date(newest[0].fetched_at).getTime() : 0;
  const stale = Date.now() - last > DAY_MS;

  if (opts.force || stale) {
    try {
      await refreshReleaseCache();
    } catch {
      // keep serving whatever is cached
    }
  }

  let query = supabaseAdmin
    .from("tmdb_releases")
    .select("*")
    .order("featured", { ascending: false })
    .order("release_date", { ascending: false })
    .limit(80);
  if (!opts.includeHidden) query = query.eq("hidden", false);

  const { data } = await query;
  return ((data ?? []) as unknown as Row[]).map(rowToItem);
}

export async function getRelease(tmdbId: number): Promise<ReleaseItem | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("tmdb_releases")
    .select("*")
    .eq("tmdb_id", tmdbId)
    .maybeSingle();
  return data ? rowToItem(data as unknown as Row) : null;
}
