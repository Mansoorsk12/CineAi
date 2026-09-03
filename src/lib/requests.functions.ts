/**
 * User "request a movie / series" workflow.
 *
 * Users never write to media_items. They submit a request that is verified
 * against TMDB before it is stored; an admin later approves it, which is what
 * actually imports the title.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface MediaRequestRow {
  id: string;
  query_title: string;
  media_type: string;
  tmdb_id: number | null;
  imdb_id: string | null;
  message: string | null;
  status: string;
  verified_title: string | null;
  verified_poster_path: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

const REQ_SELECT =
  "id,query_title,media_type,tmdb_id,imdb_id,message,status,verified_title,verified_poster_path,admin_note,created_at,updated_at";

/** Accepts a raw id or a full TMDB/IMDb URL. */
export function parseTmdbRef(input: string): { id: number | null; type: "movie" | "tv" | null } {
  const s = input.trim();
  if (!s) return { id: null, type: null };
  if (/^\d+$/.test(s)) return { id: Number(s), type: null };
  const m = s.match(/themoviedb\.org\/(movie|tv)\/(\d+)/i);
  if (m) return { id: Number(m[2]), type: m[1]!.toLowerCase() as "movie" | "tv" };
  return { id: null, type: null };
}

export function parseImdbRef(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  const m = s.match(/(tt\d{6,})/i);
  return m ? m[1]!.toLowerCase() : null;
}

export const VERIFY_ERROR =
  "We couldn't verify this title. Please check the TMDB or IMDb information and try again.";

export const submitMediaRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    title: string;
    mediaType: "movie" | "tv";
    tmdbRef?: string;
    imdbRef?: string;
    message?: string;
  }) => ({
    title: String(input?.title ?? "").trim().slice(0, 200),
    mediaType: input?.mediaType === "tv" ? ("tv" as const) : ("movie" as const),
    tmdbRef: String(input?.tmdbRef ?? "").trim(),
    imdbRef: String(input?.imdbRef ?? "").trim(),
    message: String(input?.message ?? "").trim().slice(0, 1000),
  }))
  .handler(async ({ data, context }): Promise<{ ok: boolean; error?: string; request?: MediaRequestRow }> => {
    if (data.title.length < 2) return { ok: false, error: "Please enter the movie or series name." };

    const { fetchMedia, searchTmdb, tmdb } = await import("./tmdb.server");

    const ref = parseTmdbRef(data.tmdbRef);
    const imdb = parseImdbRef(data.imdbRef);

    let mediaType: "movie" | "tv" = ref.type ?? data.mediaType;
    let tmdbId: number | null = ref.id;

    // IMDb id → TMDB id via the find endpoint.
    if (!tmdbId && imdb) {
      const found = await tmdb<any>(`/find/${imdb}`, { external_source: "imdb_id" });
      const movie = found?.movie_results?.[0];
      const tv = found?.tv_results?.[0];
      if (movie) {
        tmdbId = movie.id;
        mediaType = "movie";
      } else if (tv) {
        tmdbId = tv.id;
        mediaType = "tv";
      }
    }

    // No usable reference — resolve by title search.
    if (!tmdbId) {
      const results = await searchTmdb(data.title);
      const best = results.find((r: any) => r.mediaType === mediaType) ?? results[0];
      if (best) {
        tmdbId = best.tmdbId;
        mediaType = best.mediaType;
      }
    }

    if (!tmdbId) return { ok: false, error: VERIFY_ERROR };

    let verified = await fetchMedia(mediaType, tmdbId);
    if (!verified && !ref.type) {
      const other = mediaType === "movie" ? "tv" : "movie";
      verified = await fetchMedia(other, tmdbId);
      if (verified) mediaType = other;
    }
    if (!verified) return { ok: false, error: VERIFY_ERROR };
    if (imdb && verified.imdb_id && verified.imdb_id.toLowerCase() !== imdb) {
      return { ok: false, error: VERIFY_ERROR };
    }

    const { data: row, error } = await context.supabase
      .from("media_requests")
      .insert({
        user_id: context.userId,
        query_title: data.title,
        media_type: mediaType,
        tmdb_id: tmdbId,
        imdb_id: verified.imdb_id ?? imdb,
        message: data.message || null,
        status: "pending",
        verified_title: verified.title,
        verified_poster_path: verified.poster_path,
      })
      .select(REQ_SELECT)
      .maybeSingle();

    if (error) {
      console.error("[submitMediaRequest]", error);
      return { ok: false, error: "Could not save your request. Please try again." };
    }
    return { ok: true, request: row as MediaRequestRow };
  });

/** Live TMDB preview so the user can confirm before submitting. */
export const previewMediaRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { query: string }) => ({ query: String(input?.query ?? "").trim().slice(0, 120) }))
  .handler(async ({ data }) => {
    if (data.query.length < 2) return { results: [] };
    const { searchTmdb } = await import("./tmdb.server");
    return { results: (await searchTmdb(data.query)).slice(0, 8) };
  });

export const listMyRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MediaRequestRow[]> => {
    const { data } = await context.supabase
      .from("media_requests")
      .select(REQ_SELECT)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    return (data ?? []) as MediaRequestRow[];
  });
