import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Film } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TitleGrid } from "@/components/TitleCard";
import { FilterBar, applyFilters, emptyFilters, type Filters } from "@/components/FilterBar";
import { EmptyState } from "@/components/EmptyState";
import { CATALOG } from "@/data/catalog";

export const Route = createFileRoute("/movies")({
  head: () => ({
    meta: [
      { title: "Movies — Browse & Filter | CineAI" },
      {
        name: "description",
        content:
          "Browse every CineAI movie: filter by genre, language, year and rating across Telugu, Indian and world cinema.",
      },
      { property: "og:title", content: "Movies — Browse & Filter | CineAI" },
      { property: "og:description", content: "Filter movies by genre, language, year and rating." },
    ],
  }),
  component: () => (
    <AppShell>
      <MoviesPage />
    </AppShell>
  ),
});

const MOVIES = CATALOG.filter((t) => t.kind === "movie");

function MoviesPage() {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const results = applyFilters(MOVIES, filters);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl">Movies</h1>
        <p className="text-sm text-muted-foreground">{results.length} titles</p>
      </header>
      <FilterBar filters={filters} onChange={setFilters} />
      {results.length ? (
        <TitleGrid items={results} />
      ) : (
        <EmptyState
          icon={<Film className="size-6" aria-hidden />}
          title="No results found"
          description="Try loosening a filter or searching for something else."
          ctaLabel="Go to search"
          ctaTo="/search"
        />
      )}
    </div>
  );
}
