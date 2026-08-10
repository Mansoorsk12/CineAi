import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TitleGrid } from "@/components/TitleCard";
import { EmptyState } from "@/components/EmptyState";
import { CATALOG, type Title } from "@/data/catalog";
import { useLibrary } from "@/lib/library";

export const Route = createFileRoute("/watched")({
  head: () => ({
    meta: [
      { title: "Watched History & Stats | CineAI" },
      {
        name: "description",
        content: "Everything you've watched on CineAI with total watch time, top genre and language stats.",
      },
      { property: "og:title", content: "Watched History | CineAI" },
      { property: "og:description", content: "Your CineAI watch history and viewing statistics." },
    ],
  }),
  component: () => (
    <AppShell>
      <WatchedPage />
    </AppShell>
  ),
});

function WatchedPage() {
  const lib = useLibrary();
  const items = lib.watched
    .map((w) => CATALOG.find((t) => t.id === w.id))
    .filter((t): t is Title => Boolean(t));

  const movies = items.filter((t) => t.kind === "movie").length;
  const series = items.filter((t) => t.kind === "series").length;
  const hours = Math.round(items.reduce((s, t) => s + t.runtime, 0) / 60);
  const top = (key: "genres" | "language") => {
    const counts = new Map<string, number>();
    items.forEach((t) => {
      const vals = key === "genres" ? t.genres : [t.language];
      vals.forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1));
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">Watched</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Movies watched" value={movies} />
        <Stat label="Series watched" value={series} />
        <Stat label="Total watch time" value={`${hours}h`} />
        <Stat label="Favourite genre" value={top("genres")} />
        <Stat label="Most watched language" value={top("language")} />
      </div>
      {items.length ? (
        <TitleGrid items={items} />
      ) : (
        <EmptyState
          icon={<CheckCircle2 className="size-6" aria-hidden />}
          title="Your watch history will appear here."
          description="Mark titles as watched to build your history and analytics."
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)]">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="font-display text-3xl">{value}</p>
    </div>
  );
}
