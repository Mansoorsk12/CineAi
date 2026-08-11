import { useMemo } from "react";
import { GENRES, LANGUAGES, type Title } from "@/data/catalog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export interface Filters {
  q: string;
  genre: string;
  language: string;
  year: string;
  rating: string;
  sort: string;
}

export const emptyFilters: Filters = {
  q: "",
  genre: "all",
  language: "all",
  year: "all",
  rating: "all",
  sort: "popularity",
};

const YEARS = ["2026", "2025", "2024", "2023", "2022", "2021", "older"];

export function applyFilters(items: Title[], f: Filters): Title[] {
  const q = f.q.trim().toLowerCase();
  const out = items.filter((t) => {
    // Matches title, cast, characters, director, writers, genre and language.
    if (q && !searchIndex(t).includes(q)) return false;

    if (f.genre !== "all" && !t.genres.includes(f.genre)) return false;
    if (f.language !== "all" && t.language !== f.language) return false;
    if (f.year !== "all") {
      if (f.year === "older" ? t.year >= 2021 : String(t.year) !== f.year) return false;
    }
    if (f.rating !== "all" && t.rating < Number(f.rating)) return false;
    return true;
  });

  const sorters: Record<string, (a: Title, b: Title) => number> = {
    popularity: (a, b) => b.popularity - a.popularity,
    rating: (a, b) => b.rating - a.rating,
    latest: (a, b) => b.year - a.year,
    oldest: (a, b) => a.year - b.year,
    az: (a, b) => a.title.localeCompare(b.title),
  };
  return out.sort(sorters[f.sort] ?? sorters["popularity"]!);
}

export function FilterBar({
  filters,
  onChange,
  showSearch = true,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  showSearch?: boolean;
}) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  const active = useMemo(
    () =>
      Object.entries(filters).filter(
        ([k, v]) => k !== "sort" && k !== "q" && v !== "all" && v !== "",
      ).length,
    [filters],
  );

  return (
    <div className="space-y-3 rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center gap-2">
        {showSearch && (
          <Input
            value={filters.q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="Filter by title, cast, director…"
            aria-label="Filter results"
            className="min-w-0 flex-1 basis-56"
          />
        )}
        <Picker
          label="Genre"
          value={filters.genre}
          onValueChange={(genre) => set({ genre })}
          options={GENRES}
        />
        <Picker
          label="Language"
          value={filters.language}
          onValueChange={(language) => set({ language })}
          options={LANGUAGES}
        />
        <Picker
          label="Year"
          value={filters.year}
          onValueChange={(year) => set({ year })}
          options={YEARS}
        />
        <Picker
          label="Rating"
          value={filters.rating}
          onValueChange={(rating) => set({ rating })}
          options={["9", "8", "7", "6"]}
          format={(v) => `${v}+`}
        />
        <Select value={filters.sort} onValueChange={(sort) => set({ sort })}>
          <SelectTrigger className="w-[150px]" aria-label="Sort by">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popularity">Popularity</SelectItem>
            <SelectItem value="rating">Rating</SelectItem>
            <SelectItem value="latest">Latest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="az">A–Z</SelectItem>
          </SelectContent>
        </Select>
        {active > 0 && (
          <Button variant="ghost" size="sm" onClick={() => onChange({ ...emptyFilters, q: filters.q })}>
            Clear <Badge variant="secondary">{active}</Badge>
          </Button>
        )}
      </div>
    </div>
  );
}

function Picker({
  label,
  value,
  onValueChange,
  options,
  format,
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  options: string[];
  format?: (v: string) => string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[140px]" aria-label={label}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{label}: All</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {format ? format(o) : o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
