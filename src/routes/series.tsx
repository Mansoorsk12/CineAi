import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Clapperboard } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TitleGrid } from "@/components/TitleCard";
import { TitleRow } from "@/components/TitleRow";
import { FilterBar, applyFilters, emptyFilters, type Filters } from "@/components/FilterBar";
import { EmptyState } from "@/components/EmptyState";
import { CATALOG } from "@/data/catalog";

export const Route = createFileRoute("/series")({
  head: () => ({
    meta: [
      { title: "Series — Trending, Telugu, Korean & More | CineAI" },
      {
        name: "description",
        content:
          "Explore trending, top-rated, Telugu, Indian, Korean and English series with seasons, episodes and ratings.",
      },
      { property: "og:title", content: "Series | CineAI" },
      { property: "og:description", content: "Trending, top-rated and regional series on CineAI." },
    ],
  }),
  component: () => (
    <AppShell>
      <SeriesPage />
    </AppShell>
  ),
});

const SERIES = CATALOG.filter((t) => t.kind === "series");

function SeriesPage() {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const results = applyFilters(SERIES, filters);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-4xl">Series</h1>
        <p className="text-sm text-muted-foreground">{results.length} shows</p>
      </header>
      <TitleRow title="Trending Series" items={[...SERIES].sort((a, b) => b.popularity - a.popularity).slice(0, 10)} />
      <TitleRow title="Top Rated Series" items={[...SERIES].sort((a, b) => b.rating - a.rating).slice(0, 10)} />
      <TitleRow title="Telugu & Indian Series" items={SERIES.filter((t) => ["Telugu", "Hindi"].includes(t.language))} />
      <TitleRow title="Korean & World Series" items={SERIES.filter((t) => ["Korean", "Spanish", "Other"].includes(t.language))} />

      <div className="space-y-6">
        <h2 className="font-display text-2xl">All series</h2>
        <FilterBar filters={filters} onChange={setFilters} />
        {results.length ? (
          <TitleGrid items={results} />
        ) : (
          <EmptyState
            icon={<Clapperboard className="size-6" aria-hidden />}
            title="No series match those filters"
            description="Adjust the filters to see more shows."
            ctaLabel="Browse movies"
            ctaTo="/movies"
          />
        )}
      </div>
    </div>
  );
}
