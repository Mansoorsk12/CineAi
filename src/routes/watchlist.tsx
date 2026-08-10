import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bookmark } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TitleGrid } from "@/components/TitleCard";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { CATALOG, type Title } from "@/data/catalog";
import { useLibrary } from "@/lib/library";

export const Route = createFileRoute("/watchlist")({
  head: () => ({
    meta: [
      { title: "Your Watchlist | CineAI" },
      {
        name: "description",
        content: "Everything you've saved to watch on CineAI, sortable and markable as watched.",
      },
      { property: "og:title", content: "Your Watchlist | CineAI" },
      { property: "og:description", content: "Movies and series you saved to watch on CineAI." },
    ],
  }),
  component: () => (
    <AppShell>
      <WatchlistPage />
    </AppShell>
  ),
});

function WatchlistPage() {
  const lib = useLibrary();
  const [sort, setSort] = useState("added");
  const [filter, setFilter] = useState<"all" | "unwatched" | "watched">("all");

  let items = lib.watchlist
    .map((id) => CATALOG.find((t) => t.id === id))
    .filter((t): t is Title => Boolean(t));

  if (filter !== "all")
    items = items.filter((t) => (filter === "watched" ? lib.isWatched(t.id) : !lib.isWatched(t.id)));
  if (sort === "rating") items = [...items].sort((a, b) => b.rating - a.rating);
  if (sort === "year") items = [...items].sort((a, b) => b.year - a.year);
  if (sort === "az") items = [...items].sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl">Watchlist</h1>
          <p className="text-sm text-muted-foreground">{items.length} titles saved</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "unwatched", "watched"] as const).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
              {f[0]!.toUpperCase() + f.slice(1)}
            </Button>
          ))}
          {[
            ["added", "Recently added"],
            ["rating", "Rating"],
            ["year", "Year"],
            ["az", "A–Z"],
          ].map(([v, label]) => (
            <Button key={v} size="sm" variant={sort === v ? "secondary" : "ghost"} onClick={() => setSort(v!)}>
              {label}
            </Button>
          ))}
        </div>
      </header>

      {items.length ? (
        <TitleGrid items={items} />
      ) : (
        <EmptyState
          icon={<Bookmark className="size-6" aria-hidden />}
          title="No movies waiting for you yet."
          description="Save titles you want to watch and they'll show up here."
        />
      )}
    </div>
  );
}
