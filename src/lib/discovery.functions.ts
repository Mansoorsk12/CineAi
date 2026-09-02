/**
 * Public discovery server functions.
 *
 * Everything reads from public.media_items first. When the local catalogue
 * cannot answer a search or a detail lookup, TMDB is queried server-side and
 * the verified result is imported into media_items, so the site grows on use.
 * The TMDB key is only ever read inside these server handlers.
 */
import { createServerFn } from "@tanstack/react-start";
import type { MediaFilters, MediaItem } from "./media-types";

const SELECT =
  "id,tmdb_id,media_type,title,original_title,overview,poster_path,backdrop_path,release_date,year,runtime,genres,language,language_code,country,industry,rating,vote_count,popularity,imdb_id,trailer_key,director,cast_members,seasons,episodes,status,featured,hidden,first_imported_at,updated_at";

function toItem(row: any): MediaItem {
  return {
    ...row,
    cast_members: Array.isArray(row.cast_members) ? row.cast_members : [],
    genres: row.genres ?? [],
  } as MediaItem;
}

/** Telugu first, then other Indian languages, then the rest. */
const LANG_RANK: Record<string, number> = {
  Telugu: 0,
  Tamil: 1,
  Kannada: 2,
  Malayalam: 3,
  Hindi: 4,
  Bengali: 5,
  Marathi: 6,
  Punjabi: 7,
};
export function teluguFirst<T extends { language: string; popularity: number }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) =>
      (LANG_RANK[a.language] ?? 20) - (LANG_RANK[b.language] ?? 20) ||
      b.popularity - a.popularity,
  );
}

const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString();
const today = () => new Date().toISOString().slice(0, 10);

export interface HomeSection {
  key: string;
  label: string;
  items: MediaItem[];
}

/** Database-driven homepage rows. Public (anon RLS, hidden rows excluded). */
export const getHomeSections = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ sections: HomeSection[]; featured: MediaItem[]; total: number }> => {
    const { publicSupabase } = await import("./supabase-public.server");
    const db = publicSupabase();

    const base = () => db.from("media_items").select(SELECT).eq("hidden", false);

    const q = <T>(p: PromiseLike<{ data: T[] | null }>) => p;

    const [
      newToday,
      newWeek,
      teluguMovies,
      teluguSeries,
      indianMovies,
      indianSeries,
      trending,
      popular,
      upcoming,
      bolly,
      holly,
      kolly,
      sandal,
      molly,
      featured,
      count,
    ] = await Promise.all([
      q(base().gt("first_imported_at", daysAgo(1)).order("popularity", { ascending: false }).limit(20)),
      q(base().gt("first_imported_at", daysAgo(7)).order("popularity", { ascending: false }).limit(20)),
      q(base().eq("language", "Telugu").eq("media_type", "movie").order("release_date", { ascending: false, nullsFirst: false }).limit(20)),
      q(base().eq("language", "Telugu").eq("media_type", "tv").order("release_date", { ascending: false, nullsFirst: false }).limit(20)),
      q(base().in("language", ["Tamil", "Kannada", "Malayalam", "Hindi", "Bengali", "Marathi", "Punjabi"]).eq("media_type", "movie").order("release_date", { ascending: false, nullsFirst: false }).limit(20)),
      q(base().in("language", ["Tamil", "Kannada", "Malayalam", "Hindi", "Bengali", "Marathi", "Punjabi"]).eq("media_type", "tv").order("release_date", { ascending: false, nullsFirst: false }).limit(20)),
      q(base().order("popularity", { ascending: false }).limit(20)),
      q(base().gte("vote_count", 50).order("rating", { ascending: false }).limit(20)),
      q(base().gt("release_date", today()).order("release_date", { ascending: true }).limit(20)),
      q(base().eq("industry", "Bollywood").order("popularity", { ascending: false }).limit(20)),
      q(base().eq("industry", "Hollywood").order("popularity", { ascending: false }).limit(20)),
      q(base().eq("industry", "Kollywood").order("popularity", { ascending: false }).limit(20)),
      q(base().eq("industry", "Sandalwood").order("popularity", { ascending: false }).limit(20)),
      q(base().eq("industry", "Mollywood").order("popularity", { ascending: false }).limit(20)),
      q(base().eq("featured", true).order("popularity", { ascending: false }).limit(6)),
      db.from("media_items").select("id", { count: "exact", head: true }).eq("hidden", false),
    ]);

    const s = (key: string, label: string, res: { data: any[] | null }): HomeSection => ({
      key,
      label,
      items: (res.data ?? []).map(toItem),
    });

    const sections = [
      s("telugu-movies", "Latest Telugu Movies", teluguMovies),
      s("telugu-series", "Latest Telugu Series", teluguSeries),
      s("new-today", "New Today", newToday),
      s("new-week", "New This Week", newWeek),
      s("trending", "Trending", trending),
      s("indian-movies", "Latest Indian Movies", indianMovies),
      s("indian-series", "Latest Indian Series", indianSeries),
      s("popular", "Popular", popular),
      s("upcoming", "Upcoming", upcoming),
      s("tollywood-extra", "Bollywood", bolly),
      s("kollywood", "Kollywood", kolly),
      s("sandalwood", "Sandalwood", sandal),
      s("mollywood", "Mollywood", molly),
      s("hollywood", "Hollywood", holly),
    ].filter((x) => x.items.length > 0);

    return {
      sections,
      featured: ((featured as any).data ?? []).map(toItem),
      total: (count as any).count ?? 0,
    };
  },
);

/** Filtered browse for /discover. Public. */
export const discoverMedia = createServerFn({ method: "GET" })
  .inputValidator((input: MediaFilters) => input ?? {})
  .handler(async ({ data }): Promise<{ items: MediaItem[]; total: number }> => {
    const { publicSupabase } = await import("./supabase-public.server");
    const db = publicSupabase();
    const page = Math.max(1, data.page ?? 1);
    const size = 36;

    let query = db
      .from("media_items")
      .select(SELECT, { count: "exact" })
      .eq("hidden", false);

    if (data.language) query = query.eq("language", data.language);
    if (data.industry) query = query.eq("industry", data.industry);
    if (data.type) query = query.eq("media_type", data.type);
    if (data.year) query = query.eq("year", data.year);
    if (data.genre) query = query.contains("genres", [data.genre]);
    if (data.minRating) query = query.gte("rating", data.minRating);
    if (data.status === "upcoming") query = query.gt("release_date", today());
    if (data.status === "released") query = query.lte("release_date", today());

    if (data.sort === "rating") query = query.order("rating", { ascending: false });
    else if (data.sort === "newest")
      query = query.order("release_date", { ascending: false, nullsFirst: false });
    else query = query.order("popularity", { ascending: false });

    const { data: rows, count } = await query.range((page - 1) * size, page * size - 1);
    return { items: (rows ?? []).map(toItem), total: count ?? 0 };
  });

export interface SearchResults {
  local: MediaItem[];
  imported: MediaItem[];
}

/**
 * Database-first search with a TMDB fallback.
 *
 * Matches title / original title / director / genre / language / industry /
 * year locally. When too few local rows match, TMDB is searched by title and
 * by person (actor or director) and the best verified results are imported.
 */
export const searchMedia = createServerFn({ method: "GET" })
  .inputValidator((input: { q: string; importResults?: boolean }) => ({
    q: String(input?.q ?? "").trim().slice(0, 120),
    importResults: input?.importResults !== false,
  }))
  .handler(async ({ data }): Promise<SearchResults> => {
    if (!data.q) return { local: [], imported: [] };
    const { publicSupabase } = await import("./supabase-public.server");
    const db = publicSupabase();
    const term = data.q;
    const like = `%${term.replace(/[%,]/g, " ")}%`;

    const year = /^(19|20)\d{2}$/.test(term) ? Number(term) : null;
    const wantsTv = /\b(series|show|web series|tv)\b/i.test(term);
    const wantsMovie = /\bmovies?\b/i.test(term);
    const langWord = [
      "Telugu",
      "Tamil",
      "Kannada",
      "Malayalam",
      "Hindi",
      "Bengali",
      "Marathi",
      "Punjabi",
      "English",
      "Korean",
    ].find((l) => new RegExp(`\\b${l}\\b`, "i").test(term));
    const yearInPhrase = term.match(/\b(19|20)\d{2}\b/)?.[0];

    let query = db.from("media_items").select(SELECT).eq("hidden", false);

    if (langWord || wantsTv || wantsMovie || yearInPhrase) {
      // Structured query: "2026 Telugu movies", "Telugu series", "Tamil".
      if (langWord) query = query.eq("language", langWord);
      if (wantsTv) query = query.eq("media_type", "tv");
      else if (wantsMovie) query = query.eq("media_type", "movie");
      if (yearInPhrase) query = query.eq("year", Number(yearInPhrase));
      query = query.order("popularity", { ascending: false }).limit(60);
    } else if (year) {
      query = query.eq("year", year).order("popularity", { ascending: false }).limit(60);
    } else {
      query = query
        .or(
          [
            `title.ilike.${like}`,
            `original_title.ilike.${like}`,
            `director.ilike.${like}`,
            `overview.ilike.${like}`,
          ].join(","),
        )
        .order("popularity", { ascending: false })
        .limit(60);
    }

    const { data: rows } = await query;
    let local = (rows ?? []).map(toItem);

    // Cast search (JSONB) for plain-name queries with no title hits.
    if (!local.length && !langWord && !year) {
      const { data: castRows } = await db
        .from("media_items")
        .select(SELECT)
        .eq("hidden", false)
        .ilike("cast_members::text", like)
        .order("popularity", { ascending: false })
        .limit(40);
      local = (castRows ?? []).map(toItem);
    }

    local = teluguFirst(local);

    const imported: MediaItem[] = [];
    const isStructured = Boolean(langWord || wantsTv || wantsMovie || yearInPhrase || year);
    const needsFallback = data.importResults && (isStructured ? local.length < 6 : local.length < 3);

    if (needsFallback) {
      try {
        const { searchTmdb, searchTmdbPerson, discoverByLanguage, LANGUAGE_NAMES } = await import(
          "./tmdb.server"
        );
        const { importOne } = await import("./sync.server");

        let candidates: { tmdbId: number; mediaType: "movie" | "tv"; popularity: number }[] = [];

        if (isStructured && langWord) {
          const code = Object.entries(LANGUAGE_NAMES).find(([, n]) => n === langWord)?.[0];
          if (code) {
            const types: ("movie" | "tv")[] = wantsTv ? ["tv"] : wantsMovie ? ["movie"] : ["movie", "tv"];
            for (const t of types) {
              const found = await discoverByLanguage(t, code, 1);
              candidates.push(...found.map((f) => ({ tmdbId: f.id, mediaType: t, popularity: 0 })));
            }
          }
        }

        if (!candidates.length) {
          const byTitle = await searchTmdb(term);
          candidates = byTitle.map((r) => ({
            tmdbId: r.tmdbId,
            mediaType: r.mediaType,
            popularity: r.popularity,
          }));
          if (candidates.length < 3) {
            const byPerson = await searchTmdbPerson(term);
            candidates.push(
              ...byPerson.map((r) => ({
                tmdbId: r.tmdbId,
                mediaType: r.mediaType,
                popularity: r.popularity,
              })),
            );
          }
        }

        const existing = new Set(local.map((i) => `${i.media_type}:${i.tmdb_id}`));
        const picks = candidates
          .filter((c) => !existing.has(`${c.mediaType}:${c.tmdbId}`))
          .slice(0, 8);

        for (const p of picks) {
          const r = await importOne(p.mediaType, p.tmdbId, "search");
          if (r.outcome === "failed") continue;
          const { data: row } = await db
            .from("media_items")
            .select(SELECT)
            .eq("media_type", p.mediaType)
            .eq("tmdb_id", p.tmdbId)
            .maybeSingle();
          if (row) imported.push(toItem(row));
        }
      } catch (e) {
        console.error("[searchMedia] TMDB fallback failed", e);
      }
    }

    return { local, imported: teluguFirst(imported) };
  });

/** Detail lookup; imports from TMDB on a local miss. Public. */
export const getMediaDetail = createServerFn({ method: "GET" })
  .inputValidator((input: { type: "movie" | "tv"; tmdbId: number }) => ({
    type: input.type === "tv" ? ("tv" as const) : ("movie" as const),
    tmdbId: Number(input.tmdbId),
  }))
  .handler(async ({ data }): Promise<{ item: MediaItem | null; similar: MediaItem[] }> => {
    const { publicSupabase } = await import("./supabase-public.server");
    const db = publicSupabase();

    const read = async () =>
      (
        await db
          .from("media_items")
          .select(SELECT)
          .eq("media_type", data.type)
          .eq("tmdb_id", data.tmdbId)
          .eq("hidden", false)
          .maybeSingle()
      ).data;

    let row = await read();
    if (!row) {
      try {
        const { importOne } = await import("./sync.server");
        await importOne(data.type, data.tmdbId, "detail");
        row = await read();
      } catch (e) {
        console.error("[getMediaDetail] import failed", e);
      }
    }
    if (!row) return { item: null, similar: [] };

    const item = toItem(row);
    const { data: sim } = await db
      .from("media_items")
      .select(SELECT)
      .eq("hidden", false)
      .eq("language", item.language)
      .neq("id", item.id)
      .order("popularity", { ascending: false })
      .limit(12);

    return { item, similar: (sim ?? []).map(toItem) };
  });
