/**
 * Server-only TMDB → database synchronisation engine.
 *
 * Idempotent: every write is an upsert keyed on (media_type, tmdb_id), so
 * running a sync twice never creates duplicates. Failures are collected and
 * written to public.sync_logs instead of aborting the run.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  PRIORITY_LANGUAGES,
  discoverByLanguage,
  fetchMedia,
  tmdb,
  type MediaRow,
} from "./tmdb.server";

export type SyncMode = "daily" | "telugu" | "all";

export interface SyncResult {
  logId: string | null;
  mode: SyncMode;
  checked: number;
  added: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
  startedAt: string;
  finishedAt: string;
}

/** Max detail lookups per run — keeps us well inside TMDB rate limits. */
const DETAIL_BUDGET: Record<SyncMode, number> = { daily: 90, telugu: 60, all: 160 };

function languagesFor(mode: SyncMode) {
  if (mode === "telugu") return ["te"];
  if (mode === "all") return PRIORITY_LANGUAGES;
  return ["te", "te", "ta", "kn", "ml", "hi", "en"].filter((v, i, a) => a.indexOf(v) === i);
}

/** Upsert one TMDB title. Returns what happened, for the sync log. */
export async function importOne(
  mediaType: "movie" | "tv",
  tmdbId: number,
  source = "sync",
): Promise<{ outcome: "added" | "updated" | "failed"; row?: MediaRow; error?: string }> {
  const row = await fetchMedia(mediaType, tmdbId);
  if (!row) return { outcome: "failed", error: `TMDB ${mediaType}/${tmdbId} not found` };

  const { data: existing } = await supabaseAdmin
    .from("media_items")
    .select("id")
    .eq("media_type", mediaType)
    .eq("tmdb_id", tmdbId)
    .maybeSingle();

  const { error } = await supabaseAdmin
    .from("media_items")
    .upsert({ ...row, source }, { onConflict: "media_type,tmdb_id" });

  if (error) return { outcome: "failed", error: error.message };
  return { outcome: existing ? "updated" : "added", row };
}

/** Existing rows that were refreshed recently are skipped by the daily run. */
async function freshIds(mediaType: "movie" | "tv", ids: number[]) {
  if (!ids.length) return new Set<number>();
  const cutoff = new Date(Date.now() - 7 * 864e5).toISOString();
  const { data } = await supabaseAdmin
    .from("media_items")
    .select("tmdb_id")
    .eq("media_type", mediaType)
    .gt("updated_at", cutoff)
    .in("tmdb_id", ids);
  return new Set((data ?? []).map((r) => r.tmdb_id));
}

export async function runSync(mode: SyncMode = "daily", triggeredBy = "cron"): Promise<SyncResult> {
  const startedAt = new Date().toISOString();
  const { data: log } = await supabaseAdmin
    .from("sync_logs")
    .insert({ mode, triggered_by: triggeredBy, status: "running", started_at: startedAt })
    .select("id")
    .maybeSingle();
  const logId = log?.id ?? null;

  let checked = 0,
    added = 0,
    updated = 0,
    skipped = 0,
    failed = 0;
  const errors: string[] = [];
  let budget = DETAIL_BUDGET[mode];

  const candidates: { mediaType: "movie" | "tv"; id: number }[] = [];

  try {
    for (const code of languagesFor(mode)) {
      const pages = code === "te" ? 2 : 1;
      for (const mediaType of ["movie", "tv"] as const) {
        try {
          const found = await discoverByLanguage(mediaType, code, pages);
          for (const c of found) candidates.push({ mediaType, id: c.id });
        } catch (e) {
          errors.push(`discover ${mediaType}/${code}: ${(e as Error).message}`);
          failed++;
        }
      }
    }

    // Global trending as a wide net for international content.
    if (mode !== "telugu") {
      const trending = await tmdb<any>("/trending/all/day", {});
      for (const c of trending?.results ?? []) {
        if (c.media_type === "movie" || c.media_type === "tv")
          candidates.push({ mediaType: c.media_type, id: c.id });
      }
    }
  } catch (e) {
    errors.push(`discovery: ${(e as Error).message}`);
  }

  // De-duplicate candidates before touching the details endpoint.
  const seen = new Set<string>();
  const unique = candidates.filter((c) => {
    const k = `${c.mediaType}:${c.id}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const fresh = {
    movie: await freshIds("movie", unique.filter((c) => c.mediaType === "movie").map((c) => c.id)),
    tv: await freshIds("tv", unique.filter((c) => c.mediaType === "tv").map((c) => c.id)),
  };

  for (const c of unique) {
    checked++;
    if (fresh[c.mediaType].has(c.id)) {
      skipped++;
      continue;
    }
    if (budget <= 0) {
      skipped++;
      continue;
    }
    budget--;
    try {
      const r = await importOne(c.mediaType, c.id, "sync");
      if (r.outcome === "added") added++;
      else if (r.outcome === "updated") updated++;
      else {
        failed++;
        if (errors.length < 25) errors.push(r.error ?? "unknown error");
      }
    } catch (e) {
      failed++;
      if (errors.length < 25) errors.push(`${c.mediaType}/${c.id}: ${(e as Error).message}`);
    }
  }

  const finishedAt = new Date().toISOString();
  if (logId) {
    await supabaseAdmin
      .from("sync_logs")
      .update({
        status: failed && !added && !updated ? "failed" : "completed",
        finished_at: finishedAt,
        checked,
        added,
        updated,
        skipped,
        failed,
        errors,
      })
      .eq("id", logId);
  }

  return { logId, mode, checked, added, updated, skipped, failed, errors, startedAt, finishedAt };
}
