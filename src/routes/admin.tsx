import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Star,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  amIAdmin,
  decideRequest,
  deleteMediaItem,
  getAdminStats,
  listAllRequests,
  reimportMediaItem,
  triggerSync,
  adminListMedia,
  updateMediaItem,
} from "@/lib/admin.functions";
import type { MediaRequestRow } from "@/lib/requests.functions";
import type { MediaItem } from "@/lib/media-types";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — CineAI" },
      { name: "description", content: "CineAI administration: catalogue stats, request moderation and sync controls." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AppShell>
      <AdminGate />
    </AppShell>
  ),
});

function AdminGate() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const check = useServerFn(amIAdmin);

  const { data, isLoading } = useQuery({
    queryKey: ["am-i-admin", user?.id],
    queryFn: () => check(),
    enabled: ready && Boolean(user),
  });

  if (isLoading || !ready) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-40 rounded-3xl" />
      </div>
    );
  }

  if (!data?.admin) {
    void navigate({ to: "/", replace: true });
    return (
      <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
        Admin access required.
      </div>
    );
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const statsFn = useServerFn(getAdminStats);
  const syncFn = useServerFn(triggerSync);
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState<string | null>(null);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => statsFn(),
  });

  const runSync = async (mode: "daily" | "telugu" | "all") => {
    setSyncing(mode);
    try {
      const r = await syncFn({ data: { mode } });
      toast.success(
        `${mode} sync done: +${r.added} added, ${r.updated} updated${r.failed ? `, ${r.failed} failed` : ""}`,
      );
      await queryClient.invalidateQueries();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(null);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-4xl">
            <ShieldCheck className="size-7 text-cinema" aria-hidden /> Admin
          </h1>
          <p className="text-sm text-muted-foreground">Catalogue, requests and sync controls.</p>
        </div>
        <div className="flex gap-2">
          {(["daily", "telugu", "all"] as const).map((mode) => (
            <Button
              key={mode}
              variant="secondary"
              size="sm"
              className="gap-1.5 rounded-full capitalize"
              disabled={syncing !== null}
              onClick={() => void runSync(mode)}
            >
              {syncing === mode ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="size-3.5" aria-hidden />
              )}
              {mode} sync
            </Button>
          ))}
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Movies" value={stats.movies} />
            <Stat label="Series" value={stats.series} />
            <Stat label="Telugu movies" value={stats.teluguMovies} />
            <Stat label="Telugu series" value={stats.teluguSeries} />
            <Stat label="Imported (7d)" value={stats.recentlyImported} />
            <Stat label="Hidden" value={stats.hidden} />
            <Stat label="Featured" value={stats.featured} />
            <Stat label="Pending requests" value={stats.pending} highlight={stats.pending > 0} />
          </div>

          {stats.lastSync && (
            <p className="rounded-2xl border bg-card px-4 py-3 text-xs text-muted-foreground">
              Last sync: <span className="font-medium text-foreground">{stats.lastSync.mode}</span> ·{" "}
              {stats.lastSync.status} · +{stats.lastSync.added} added, {stats.lastSync.updated} updated,{" "}
              {stats.lastSync.failed} failed ·{" "}
              {new Date(stats.lastSync.started_at).toLocaleString()}
            </p>
          )}
        </>
      ) : null}

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="catalogue">Catalogue</TabsTrigger>
        </TabsList>
        <TabsContent value="requests" className="pt-4">
          <RequestsTab />
        </TabsContent>
        <TabsContent value="catalogue" className="pt-4">
          <CatalogueTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${highlight ? "bg-cinema/10 border-cinema/40" : "bg-card"}`}
    >
      <p className="font-display text-3xl">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function RequestsTab() {
  const listFn = useServerFn(listAllRequests);
  const decideFn = useServerFn(decideRequest);
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("pending");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin-requests", status],
    queryFn: () => listFn({ data: { status: status === "all" ? "" : status } }),
  });

  const decide = async (r: MediaRequestRow, decision: "approved" | "rejected" | "reviewing") => {
    setBusyId(r.id);
    try {
      const res = await decideFn({ data: { id: r.id, decision, note: notes[r.id] ?? "" } });
      if (!res.ok) {
        toast.error(res.error ?? "Action failed");
        return;
      }
      toast.success(`Request ${decision}`);
      await queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-44 rounded-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="reviewing">Reviewing</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
          <SelectItem value="all">All</SelectItem>
        </SelectContent>
      </Select>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : !requests?.length ? (
        <p className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          No {status === "all" ? "" : status} requests.
        </p>
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => (
            <li key={r.id} className="space-y-3 rounded-2xl border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{r.verified_title ?? r.query_title}</span>
                <Badge variant="secondary">{r.media_type === "tv" ? "Series" : "Movie"}</Badge>
                <Badge variant="outline" className="capitalize">{r.status}</Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString()} · TMDB {r.tmdb_id ?? "—"}
                </span>
              </div>
              {r.message && <p className="text-sm text-muted-foreground">“{r.message}”</p>}
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  placeholder="Admin note (optional)"
                  value={notes[r.id] ?? ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                  className="h-9 max-w-xs rounded-xl text-sm"
                  maxLength={1000}
                />
                <Button
                  size="sm"
                  className="gap-1 rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
                  disabled={busyId === r.id}
                  onClick={() => void decide(r, "approved")}
                >
                  {busyId === r.id ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <CheckCircle2 className="size-3.5" aria-hidden />}
                  Approve & import
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1 rounded-full"
                  disabled={busyId === r.id}
                  onClick={() => void decide(r, "reviewing")}
                >
                  Reviewing
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-1 rounded-full"
                  disabled={busyId === r.id}
                  onClick={() => void decide(r, "rejected")}
                >
                  <XCircle className="size-3.5" aria-hidden /> Reject
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CatalogueTab() {
  const listFn = useServerFn(adminListMedia);
  const updateFn = useServerFn(updateMediaItem);
  const deleteFn = useServerFn(deleteMediaItem);
  const reimportFn = useServerFn(reimportMediaItem);
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-media", search, page],
    queryFn: () => listFn({ data: { q: search, page } }),
  });

  const act = async (id: string, fn: () => Promise<{ ok: boolean; error?: string }>, done: string) => {
    setBusyId(id);
    try {
      const r = await fn();
      if (!r.ok) {
        toast.error(r.error ?? "Action failed");
        return;
      }
      toast.success(done);
      await queryClient.invalidateQueries({ queryKey: ["admin-media"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    } finally {
      setBusyId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / 40));

  return (
    <div className="space-y-4">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(q.trim());
        }}
      >
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search catalogue by title…"
          className="max-w-sm rounded-full"
        />
        <Button type="submit" variant="secondary" className="rounded-full">Search</Button>
      </form>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : !data?.items.length ? (
        <p className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">No titles found.</p>
      ) : (
        <>
          <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
            {data.items.map((m) => (
              <CatalogueRow
                key={m.id}
                item={m}
                busy={busyId === m.id}
                onToggleHidden={() => void act(m.id, () => updateFn({ data: { id: m.id, hidden: !m.hidden } }), m.hidden ? "Unhidden" : "Hidden")}
                onToggleFeatured={() => void act(m.id, () => updateFn({ data: { id: m.id, featured: !m.featured } }), m.featured ? "Unfeatured" : "Featured")}
                onReimport={() => void act(m.id, () => reimportFn({ data: { id: m.id } }), "Re-imported from TMDB")}
                onDelete={() => {
                  if (window.confirm(`Delete “${m.title}” from the catalogue?`)) {
                    void act(m.id, () => deleteFn({ data: { id: m.id } }), "Deleted");
                  }
                }}
              />
            ))}
          </ul>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 text-sm">
              <Button variant="secondary" size="sm" className="rounded-full" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="secondary" size="sm" className="rounded-full" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CatalogueRow({
  item: m,
  busy,
  onToggleHidden,
  onToggleFeatured,
  onReimport,
  onDelete,
}: {
  item: MediaItem;
  busy: boolean;
  onToggleHidden: () => void;
  onToggleFeatured: () => void;
  onReimport: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <Link
          to="/media/$type/$tmdbId"
          params={{ type: m.media_type, tmdbId: String(m.tmdb_id) }}
          className="block truncate font-medium hover:underline"
        >
          {m.title}
        </Link>
        <p className="text-xs text-muted-foreground">
          {m.media_type === "tv" ? "Series" : "Movie"} · {m.language} · {m.year ?? "—"} · ★ {m.rating?.toFixed(1) ?? "—"}
        </p>
      </div>
      {m.featured ? <Badge className="bg-cinema text-cinema-foreground">Featured</Badge> : null}
      {m.hidden ? <Badge variant="destructive">Hidden</Badge> : null}
      <div className="flex items-center gap-1">
        {busy && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />}
        <Button size="icon" variant="ghost" aria-label={m.hidden ? "Unhide" : "Hide"} onClick={onToggleHidden} disabled={busy}>
          {m.hidden ? <Eye className="size-4" aria-hidden /> : <EyeOff className="size-4" aria-hidden />}
        </Button>
        <Button size="icon" variant="ghost" aria-label={m.featured ? "Unfeature" : "Feature"} onClick={onToggleFeatured} disabled={busy}>
          <Star className={`size-4 ${m.featured ? "fill-cinema text-cinema" : ""}`} aria-hidden />
        </Button>
        <Button size="icon" variant="ghost" aria-label="Re-import from TMDB" onClick={onReimport} disabled={busy}>
          <RefreshCw className="size-4" aria-hidden />
        </Button>
        <Button size="icon" variant="ghost" aria-label="Delete" onClick={onDelete} disabled={busy}>
          <Trash2 className="size-4 text-destructive" aria-hidden />
        </Button>
      </div>
    </li>
  );
}
