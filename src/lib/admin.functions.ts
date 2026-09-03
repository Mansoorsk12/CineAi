/**
 * Admin backend. Every function verifies public.has_role(uid,'admin')
 * server-side through the caller's RLS-scoped client before doing anything.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { MediaItem } from "./media-types";
import type { MediaRequestRow } from "./requests.functions";

const REQ_SELECT =
  "id,user_id,query_title,media_type,tmdb_id,imdb_id,message,status,verified_title,verified_poster_path,admin_note,created_at,updated_at";

const MEDIA_SELECT =
  "id,tmdb_id,media_type,title,original_title,overview,poster_path,backdrop_path,release_date,year,runtime,genres,language,language_code,country,industry,rating,vote_count,popularity,imdb_id,trailer_key,director,cast_members,seasons,episodes,status,featured,hidden,first_imported_at,updated_at";

async function assertAdmin(context: any) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

/** Is the signed-in user an admin? Used to show/hide the navbar link. */
export const amIAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ admin: boolean }> => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { admin: Boolean(data) };
  });

export interface AdminStats {
  movies: number;
  series: number;
  teluguMovies: number;
  teluguSeries: number;
  recentlyImported: number;
  hidden: number;
  featured: number;
  pending: number;
  approved: number;
  rejected: number;
  lastSync: {
    mode: string;
    status: string;
    started_at: string;
    finished_at: string | null;
    checked: number;
    added: number;
    updated: number;
    skipped: number;
    failed: number;
    errors: string[];
  } | null;
}

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminStats> => {
    await assertAdmin(context);
    const db = context.supabase;
    const count = (q: any) => q.then((r: any) => r.count ?? 0);
    const c = (build: (q: any) => any) =>
      count(build(db.from("media_items").select("id", { count: "exact", head: true })));
    const rc = (status: string) =>
      count(
        db
          .from("media_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", status),
      );

    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();

    const [movies, series, tm, ts, recent, hidden, featured, pending, reviewing, approved, rejected, sync] =
      await Promise.all([
        c((q) => q.eq("media_type", "movie")),
        c((q) => q.eq("media_type", "tv")),
        c((q) => q.eq("media_type", "movie").eq("language", "Telugu")),
        c((q) => q.eq("media_type", "tv").eq("language", "Telugu")),
        c((q) => q.gt("first_imported_at", weekAgo)),
        c((q) => q.eq("hidden", true)),
        c((q) => q.eq("featured", true)),
        rc("pending"),
        rc("reviewing"),
        rc("approved"),
        rc("rejected"),
        db
          .from("sync_logs")
          .select("mode,status,started_at,finished_at,checked,added,updated,skipped,failed,errors")
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    return {
      movies,
      series,
      teluguMovies: tm,
      teluguSeries: ts,
      recentlyImported: recent,
      hidden,
      featured,
      pending: pending + reviewing,
      approved,
      rejected,
      lastSync: ((sync as any).data
        ? { ...(sync as any).data, errors: Array.isArray((sync as any).data.errors) ? (sync as any).data.errors.map(String) : [] }
        : null) as AdminStats["lastSync"],
    };
  });

export const listAllRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input?: { status?: string }) => ({ status: input?.status ?? "" }))
  .handler(async ({ data, context }): Promise<MediaRequestRow[]> => {
    await assertAdmin(context);
    let q = context.supabase
      .from("media_requests")
      .select(REQ_SELECT)
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows } = await q;
    return (rows ?? []) as MediaRequestRow[];
  });

/** Approve: re-verify against TMDB, import via the existing engine, mark approved. */
export const decideRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; decision: "approved" | "rejected" | "reviewing"; note?: string }) => ({
    id: String(input.id),
    decision:
      input.decision === "approved" ? ("approved" as const)
      : input.decision === "reviewing" ? ("reviewing" as const)
      : ("rejected" as const),
    note: String(input?.note ?? "").trim().slice(0, 1000),
  }))
  .handler(async ({ data, context }): Promise<{ ok: boolean; error?: string }> => {
    await assertAdmin(context);
    const db = context.supabase;

    const { data: req } = await db
      .from("media_requests")
      .select("id,tmdb_id,media_type")
      .eq("id", data.id)
      .maybeSingle();
    if (!req) return { ok: false, error: "Request not found." };

    const patch: Record<string, any> = {
      status: data.decision,
      admin_note: data.note || null,
    };

    if (data.decision === "approved") {
      if (!req.tmdb_id) return { ok: false, error: "Request has no verified TMDB id." };
      const { fetchMedia } = await import("./tmdb.server");
      const type = req.media_type === "tv" ? "tv" : "movie";
      const verified = await fetchMedia(type, req.tmdb_id);
      if (!verified) return { ok: false, error: "Could not verify this title on TMDB." };
      const { importOne } = await import("./sync.server");
      const r = await importOne(type, req.tmdb_id, "request");
      if (r.outcome === "failed") return { ok: false, error: r.error ?? "Import failed." };
      patch["verified_title"] = verified.title;
      patch["verified_poster_path"] = verified.poster_path;
    }

    const { error } = await db.from("media_requests").update(patch).eq("id", data.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

/** Admin catalogue browse (includes hidden rows). */
export const adminListMedia = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input?: { q?: string; page?: number }) => ({
    q: String(input?.q ?? "").trim().slice(0, 120),
    page: Math.max(1, Number(input?.page ?? 1)),
  }))
  .handler(async ({ data, context }): Promise<{ items: MediaItem[]; total: number }> => {
    await assertAdmin(context);
    const size = 40;
    let q = context.supabase.from("media_items").select(MEDIA_SELECT, { count: "exact" });
    if (data.q) q = q.ilike("title", `%${data.q.replace(/[%,]/g, " ")}%`);
    const { data: rows, count } = await q
      .order("updated_at", { ascending: false })
      .range((data.page - 1) * size, data.page * size - 1);
    return { items: (rows ?? []) as unknown as MediaItem[], total: count ?? 0 };
  });

/** Hide / unhide / feature / unfeature / metadata edit. */
export const updateMediaItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    id: string;
    hidden?: boolean;
    featured?: boolean;
    title?: string;
    overview?: string;
    language?: string;
    industry?: string;
    trailer_key?: string;
  }) => input)
  .handler(async ({ data, context }): Promise<{ ok: boolean; error?: string }> => {
    await assertAdmin(context);
    const patch: Record<string, any> = {};
    for (const k of ["hidden", "featured", "title", "overview", "language", "industry", "trailer_key"] as const) {
      if (data[k] !== undefined) patch[k] = data[k];
    }
    if (!Object.keys(patch).length) return { ok: true };
    const { error } = await context.supabase.from("media_items").update(patch).eq("id", data.id);
    return error ? { ok: false, error: error.message } : { ok: true };
  });

export const deleteMediaItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => ({ id: String(input.id) }))
  .handler(async ({ data, context }): Promise<{ ok: boolean; error?: string }> => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("media_items").delete().eq("id", data.id);
    return error ? { ok: false, error: error.message } : { ok: true };
  });

/** Re-pull fresh TMDB metadata for one row. */
export const reimportMediaItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => ({ id: String(input.id) }))
  .handler(async ({ data, context }): Promise<{ ok: boolean; error?: string }> => {
    await assertAdmin(context);
    const { data: row } = await context.supabase
      .from("media_items")
      .select("tmdb_id,media_type")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) return { ok: false, error: "Not found." };
    const { importOne } = await import("./sync.server");
    const r = await importOne(row.media_type === "tv" ? "tv" : "movie", row.tmdb_id, "reimport");
    return r.outcome === "failed" ? { ok: false, error: r.error ?? "Re-import failed." } : { ok: true };
  });

/** Manual sync: daily / telugu / all. */
export const triggerSync = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input?: { mode?: string }) => ({
    mode:
      input?.mode === "telugu" ? ("telugu" as const)
      : input?.mode === "all" ? ("all" as const)
      : ("daily" as const),
  }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { runSync } = await import("./sync.server");
    const r = await runSync(data.mode, "admin");
    return {
      success: true,
      mode: r.mode,
      checked: r.checked,
      added: r.added,
      updated: r.updated,
      skipped: r.skipped,
      failed: r.failed,
      errors: r.errors.slice(0, 10),
    };
  });
