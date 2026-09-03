/**
 * Daily TMDB sync endpoint (called by pg_cron at 02:15 UTC).
 *
 * Auth: `x-cron-token` header must match CRON_SECRET or the `cron_token`
 * row in public.app_secrets (service-role only table).
 */
import { createFileRoute } from "@tanstack/react-router";

async function authorize(token: string | null): Promise<boolean> {
  if (!token) return false;
  const envSecret = process.env["CRON_SECRET"];
  if (envSecret && token === envSecret) return true;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("app_secrets")
      .select("value")
      .eq("key", "cron_token")
      .maybeSingle();
    return Boolean(data?.value) && data!.value === token;
  } catch (e) {
    console.error("[cron/tmdb-sync] token lookup failed", e);
    return false;
  }
}

async function handle(request: Request): Promise<Response> {
  const token =
    request.headers.get("x-cron-token") ??
    new URL(request.url).searchParams.get("token");

  if (!(await authorize(token))) {
    return Response.json({ success: false, error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  let mode = url.searchParams.get("mode") ?? "daily";
  if (request.method === "POST") {
    try {
      const body = (await request.clone().json()) as { mode?: string };
      if (body?.mode) mode = body.mode;
    } catch {
      /* no body / not JSON */
    }
  }
  if (!["daily", "telugu", "all"].includes(mode)) mode = "daily";

  try {
    const { runSync } = await import("@/lib/sync.server");
    const r = await runSync(mode as "daily" | "telugu" | "all", "cron");
    return Response.json({
      success: true,
      mode: r.mode,
      checked: r.checked,
      added: r.added,
      updated: r.updated,
      skipped: r.skipped,
      failed: r.failed,
      errors: r.errors.slice(0, 10),
      startedAt: r.startedAt,
      finishedAt: r.finishedAt,
    });
  } catch (e) {
    console.error("[cron/tmdb-sync] sync failed", e);
    return Response.json({ success: false, mode, error: "sync failed" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/cron/tmdb-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => handle(request),
      GET: async ({ request }) => handle(request),
    },
  },
});
