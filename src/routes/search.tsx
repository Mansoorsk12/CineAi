import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SearchX } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TitleGrid } from "@/components/TitleCard";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CATALOG } from "@/data/catalog";
import { useLibrary } from "@/lib/library";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search Movies, Series, Cast & Directors | CineAI" },
      {
        name: "description",
        content:
          "Real-time CineAI search across movies, series, actors, directors, genres, languages and years.",
      },
      { property: "og:title", content: "Search | CineAI" },
      { property: "og:description", content: "Search movies, series, cast, directors and genres." },
    ],
  }),
  component: () => (
    <AppShell>
      <SearchPage />
    </AppShell>
  ),
});

function SearchPage() {
  const lib = useLibrary();
  const [raw, setRaw] = useState("");
  const [q, setQ] = useState("");

  // Debounced query — avoids re-filtering on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => {
      setQ(raw);
      if (raw.trim().length > 2) lib.addSearch(raw);
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return CATALOG.filter((t) =>
      [t.title, t.director, t.language, String(t.year), ...t.genres, ...t.cast]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [q]);

  const suggestions = useMemo(() => {
    const term = raw.trim().toLowerCase();
    if (term.length < 2) return [];
    return CATALOG.filter((t) => t.title.toLowerCase().includes(term))
      .slice(0, 5)
      .map((t) => t.title);
  }, [raw]);

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <h1 className="font-display text-4xl">Search</h1>
        <Input
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="Try “Prabhas”, “Telugu thriller”, “Nolan”, “2024”…"
          aria-label="Search movies and series"
          className="h-12 text-base"
          autoFocus
        />
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button key={s} onClick={() => setRaw(s)}>
                <Badge variant="secondary">{s}</Badge>
              </button>
            ))}
          </div>
        )}
        {!raw && lib.searchHistory.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            Recent:
            {lib.searchHistory.slice(0, 6).map((s) => (
              <button key={s} onClick={() => setRaw(s)}>
                <Badge variant="outline">{s}</Badge>
              </button>
            ))}
          </div>
        )}
      </header>

      {q.trim() && results.length === 0 && (
        <EmptyState
          icon={<SearchX className="size-6" aria-hidden />}
          title="No results found"
          description={`Nothing matched “${q}”. Try a different title, actor or genre.`}
        />
      )}
      {results.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">{results.length} results</p>
          <TitleGrid items={results} />
        </>
      )}
    </div>
  );
}
