import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ReleaseItem } from "./releases-shared";

/** Public: cached theatre + OTT releases (auto-refreshed once a day). */
export const listReleases = createServerFn({ method: "GET" }).handler(
  async (): Promise<ReleaseItem[]> => {
    const { loadReleases } = await import("./releases.server");
    try {
      return await loadReleases();
    } catch {
      return [];
    }
  },
);

/** Public: a single cached release (used by the release details page). */
export const getReleaseById = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ tmdbId: z.number().int().positive() }).parse(d))
  .handler(async ({ data }): Promise<ReleaseItem | null> => {
    const { getRelease } = await import("./releases.server");
    try {
      return await getRelease(data.tmdbId);
    } catch {
      return null;
    }
  });

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

/** Admin: every release including hidden ones. */
export const adminListReleases = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ReleaseItem[]> => {
    await assertAdmin(context as any);
    const { loadReleases } = await import("./releases.server");
    return loadReleases({ includeHidden: true });
  });

/** Admin: force a TMDB refresh now. */
export const adminRefreshReleases = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ count: number }> => {
    await assertAdmin(context as any);
    const { refreshReleaseCache } = await import("./releases.server");
    return { count: await refreshReleaseCache() };
  });

/** Admin: hide/unhide or feature/unfeature a release. */
export const adminUpdateRelease = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        tmdbId: z.number().int().positive(),
        hidden: z.boolean().optional(),
        featured: z.boolean().optional(),
      })
      .parse(d),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, boolean> = {};
    if (data.hidden !== undefined) patch["hidden"] = data.hidden;
    if (data.featured !== undefined) patch["featured"] = data.featured;
    if (!Object.keys(patch).length) return { ok: true };
    const { error } = await supabaseAdmin
      .from("tmdb_releases")
      .update(patch)
      .eq("tmdb_id", data.tmdbId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
