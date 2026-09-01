/**
 * Server-only TMDB client.
 *
 * The API key is read from the server environment inside each call — it is
 * never bundled into client code. Every helper degrades gracefully (returns
 * null / empty) so a TMDB outage can never take the website down.
 */

const BASE = "https://api.themoviedb.org/3";

export interface TmdbCastMember {
  name: string;
  character: string | null;
  profilePath: string | null;
}

/** Row shape written to public.media_items. */
export interface MediaRow {
  tmdb_id: number;
  media_type: "movie" | "tv";
  title: string;
  original_title: string | null;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  year: number | null;
  runtime: number | null;
  genres: string[];
  language: string;
  language_code: string;
  country: string | null;
  industry: string;
  rating: number;
  vote_count: number;
  popularity: number;
  imdb_id: string | null;
  trailer_key: string | null;
  director: string | null;
  cast_members: TmdbCastMember[];
  seasons: number | null;
  episodes: number | null;
  status: string | null;
  source?: string;
}

export const LANGUAGE_NAMES: Record<string, string> = {
  te: "Telugu",
  ta: "Tamil",
  hi: "Hindi",
  kn: "Kannada",
  ml: "Malayalam",
  bn: "Bengali",
  mr: "Marathi",
  pa: "Punjabi",
  gu: "Gujarati",
  or: "Odia",
  as: "Assamese",
  ur: "Urdu",
  en: "English",
  ko: "Korean",
  ja: "Japanese",
  zh: "Chinese",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  ru: "Russian",
  tr: "Turkish",
  th: "Thai",
  ar: "Arabic",
};

export const INDUSTRY_BY_LANGUAGE: Record<string, string> = {
  te: "Tollywood",
  ta: "Kollywood",
  hi: "Bollywood",
  kn: "Sandalwood",
  ml: "Mollywood",
  en: "Hollywood",
  bn: "Bengali Cinema",
  mr: "Marathi Cinema",
  pa: "Pollywood",
};

export const INDIAN_LANGUAGES = ["te", "ta", "hi", "kn", "ml", "bn", "mr", "pa", "gu", "or"];

/** Discovery order — Telugu is always first. */
export const PRIORITY_LANGUAGES = ["te", "ta", "kn", "ml", "hi", "bn", "mr", "pa", "en"];

export const languageName = (code: string) => LANGUAGE_NAMES[code] ?? "Other";
export const industryOf = (code: string) =>
  INDUSTRY_BY_LANGUAGE[code] ?? (INDIAN_LANGUAGES.includes(code) ? "Indian Cinema" : "International");

function apiKey(): string {
  const key = process.env["TMDB_API_KEY"];
  if (!key) throw new Error("TMDB_API_KEY is not configured");
  return key;
}

/** Single TMDB GET with retry/backoff for rate limits. Returns null on failure. */
export async function tmdb<T = any>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T | null> {
  const key = apiKey();
  const v4 = key.startsWith("ey");
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) if (v != null) url.searchParams.set(k, String(v));
  if (!v4) url.searchParams.set("api_key", key);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: v4
          ? { Authorization: `Bearer ${key}`, accept: "application/json" }
          : { accept: "application/json" },
      });
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
        continue;
      }
      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch {
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  return null;
}

const validKey = (k?: string | null) => (k && /^[\w-]{11}$/.test(k) ? k : null);

function pickTrailer(videos: any): string | null {
  const vids = (videos?.results ?? []).filter((v: any) => v.site === "YouTube");
  const rank = (v: any) => {
    let s = 0;
    if (v.type === "Trailer") s += 40;
    else if (v.type === "Teaser") s += 20;
    if (v.official) s += 20;
    if (/official/i.test(v.name ?? "")) s += 10;
    return s;
  };
  const best = vids.sort((a: any, b: any) => rank(b) - rank(a))[0];
  return best && rank(best) >= 20 ? validKey(best.key) : null;
}

/** Full metadata for one TMDB id, mapped to a media_items row. */
export async function fetchMedia(
  mediaType: "movie" | "tv",
  tmdbId: number,
): Promise<MediaRow | null> {
  const d = await tmdb<any>(`/${mediaType}/${tmdbId}`, {
    append_to_response: "credits,videos,external_ids",
  });
  if (!d || !(d.title || d.name)) return null;

  const crew: any[] = d.credits?.crew ?? [];
  const director =
    crew.filter((c) => c.job === "Director").map((c) => c.name).join(", ") ||
    (d.created_by ?? []).map((c: any) => c.name).join(", ") ||
    null;

  let trailer = pickTrailer(d.videos);
  if (!trailer) {
    const alt = await tmdb<any>(`/${mediaType}/${tmdbId}/videos`, {
      include_video_language: "en,null,te,hi,ta,ml,kn",
    });
    trailer = pickTrailer(alt);
  }

  const releaseDate: string | null = d.release_date || d.first_air_date || null;
  const code: string = d.original_language ?? "";
  const country: string | null =
    d.production_countries?.[0]?.name ?? d.origin_country?.[0] ?? null;

  return {
    tmdb_id: tmdbId,
    media_type: mediaType,
    title: d.title || d.name,
    original_title: d.original_title || d.original_name || null,
    overview: d.overview ?? "",
    poster_path: d.poster_path ?? null,
    backdrop_path: d.backdrop_path ?? null,
    release_date: releaseDate || null,
    year: releaseDate ? Number(releaseDate.slice(0, 4)) : null,
    runtime: d.runtime ?? d.episode_run_time?.[0] ?? null,
    genres: (d.genres ?? []).map((g: any) => g.name),
    language: languageName(code),
    language_code: code,
    country,
    industry: industryOf(code),
    rating: d.vote_average ? Math.round(d.vote_average * 10) / 10 : 0,
    vote_count: d.vote_count ?? 0,
    popularity: d.popularity ?? 0,
    imdb_id: d.imdb_id ?? d.external_ids?.imdb_id ?? null,
    trailer_key: trailer,
    director,
    cast_members: (d.credits?.cast ?? []).slice(0, 15).map((c: any) => ({
      name: c.name,
      character: c.character || null,
      profilePath: c.profile_path ?? null,
    })),
    seasons: mediaType === "tv" ? (d.number_of_seasons ?? null) : null,
    episodes: mediaType === "tv" ? (d.number_of_episodes ?? null) : null,
    status: d.status ?? null,
  };
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Recently released + upcoming candidates for one language. */
export async function discoverByLanguage(
  mediaType: "movie" | "tv",
  code: string,
  pages = 1,
): Promise<{ id: number }[]> {
  const now = new Date();
  const from = iso(new Date(now.getTime() - 75 * 864e5));
  const to = iso(new Date(now.getTime() + 120 * 864e5));
  const out: { id: number }[] = [];
  for (let page = 1; page <= pages; page++) {
    const params: Record<string, string | number> = {
      with_original_language: code,
      sort_by: "popularity.desc",
      include_adult: "false",
      page,
    };
    if (mediaType === "movie") {
      params["primary_release_date.gte"] = from;
      params["primary_release_date.lte"] = to;
    } else {
      params["first_air_date.gte"] = from;
      params["first_air_date.lte"] = to;
    }
    const r = await tmdb<any>(`/discover/${mediaType}`, params);
    for (const c of r?.results ?? []) out.push({ id: c.id });
    if (!r || (r.results ?? []).length < 20) break;
  }
  return out;
}

/** Free-text TMDB search (multi), lightly normalised. */
export async function searchTmdb(query: string, page = 1) {
  const r = await tmdb<any>("/search/multi", { query, include_adult: "false", page });
  return (r?.results ?? [])
    .filter((x: any) => x.media_type === "movie" || x.media_type === "tv")
    .map((x: any) => ({
      tmdbId: x.id as number,
      mediaType: x.media_type as "movie" | "tv",
      title: (x.title || x.name) as string,
      originalTitle: (x.original_title || x.original_name || null) as string | null,
      overview: (x.overview ?? "") as string,
      posterPath: (x.poster_path ?? null) as string | null,
      backdropPath: (x.backdrop_path ?? null) as string | null,
      releaseDate: (x.release_date || x.first_air_date || null) as string | null,
      language: languageName(x.original_language ?? ""),
      languageCode: (x.original_language ?? "") as string,
      industry: industryOf(x.original_language ?? ""),
      rating: x.vote_average ? Math.round(x.vote_average * 10) / 10 : 0,
      popularity: x.popularity ?? 0,
    }));
}

/** Titles credited to a person (actor or director) matching the query. */
export async function searchTmdbPerson(query: string) {
  const r = await tmdb<any>("/search/person", { query, include_adult: "false" });
  const person = (r?.results ?? [])[0];
  if (!person) return [];
  const credits = await tmdb<any>(`/person/${person.id}/combined_credits`);
  const all = [...(credits?.cast ?? []), ...(credits?.crew ?? [])];
  const seen = new Set<string>();
  return all
    .filter((x: any) => x.media_type === "movie" || x.media_type === "tv")
    .filter((x: any) => {
      const k = `${x.media_type}:${x.id}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort((a: any, b: any) => (b.popularity ?? 0) - (a.popularity ?? 0))
    .slice(0, 30)
    .map((x: any) => ({
      tmdbId: x.id as number,
      mediaType: x.media_type as "movie" | "tv",
      title: (x.title || x.name) as string,
      originalTitle: (x.original_title || x.original_name || null) as string | null,
      overview: (x.overview ?? "") as string,
      posterPath: (x.poster_path ?? null) as string | null,
      backdropPath: (x.backdrop_path ?? null) as string | null,
      releaseDate: (x.release_date || x.first_air_date || null) as string | null,
      language: languageName(x.original_language ?? ""),
      languageCode: (x.original_language ?? "") as string,
      industry: industryOf(x.original_language ?? ""),
      rating: x.vote_average ? Math.round(x.vote_average * 10) / 10 : 0,
      popularity: x.popularity ?? 0,
    }));
}
