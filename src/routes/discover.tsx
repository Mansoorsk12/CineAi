import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Compass, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MediaGrid } from "@/components/MediaCard";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { discoverMedia, teluguFirst } from "@/lib/discovery.functions";
import {
  GENRE_OPTIONS,
  INDUSTRY_OPTIONS,
  LANGUAGE_OPTIONS,
  type MediaFilters,
  type MediaItem,
} from "@/lib/media-types";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover Movies & Series — Telugu First | CineAI" },
      {
        name: "description",
        content:
          "Browse CineAI's live catalogue of movies and series with language, industry, genre, year, rating and release-status filters. Telugu titles first.",
      },
      { property: "og:title", content: "Discover Movies & Series — Telugu First | CineAI" },
      {
        property: "og:description",
        content: "Filter the live CineAI catalogue by language, industry, genre, year and rating.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <DiscoverPage />
    </AppShell>
  ),
});

const ANY = "any";
const YEARS = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() + 1 - i);

function DiscoverPage() {
  const run = useServerFn(discoverMedia);
  const [filters, setFilters] = useState<MediaFilters>({ sort: "popularity" });
  const [page, setPage] = useState(1);
  const [extra, setExtra] = useState<MediaItem[]>([]);

  const set = (patch: MediaFilters) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
    setExtra([]);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["discover", filters],
    queryFn: () => run({ data: { ...filters, page: 1 } }),
  });

  const items = useMemo(() => {
    const all = [...(data?.items ?? []), ...extra];
    return filters.language ? all : teluguFirst(all);
  }, [data, extra, filters.language]);

  const total = data?.total ?? 0;
  const [loadingMore, setLoadingMore] = useState(false);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const res = await run({ data: { ...filters, page: next } });
      setExtra((e) => [...e, ...res.items]);
      setPage(next);
    } finally {
      setLoadingMore(false);
    }
  };

  const dropdown = (
    label: string,
    value: string | undefined,
    options: { value: string; label: string }[],
    onChange: (v: string | undefined) => void,
  ) => (
    <Select
      value={value ?? ANY}
      onValueChange={(v) => onChange(v === ANY ? undefined : v)}
    >
      <SelectTrigger className="w-[9.5rem] rounded-full">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ANY}>{label}: Any</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl">Discover</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading catalogue…" : `${total} titles in the live catalogue`}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setFilters({ sort: "popularity" });
            setPage(1);
            setExtra([]);
          }}
        >
          Reset filters
        </Button>
      </header>

      <div className="flex flex-wrap gap-2 rounded-2xl border bg-card p-3">
        {dropdown(
          "Type",
          filters.type,
          [
            { value: "movie", label: "Movies" },
            { value: "tv", label: "Series" },
          ],
          (v) => set({ type: v as MediaFilters["type"] }),
        )}
        {dropdown(
          "Language",
          filters.language,
          LANGUAGE_OPTIONS.map((l) => ({ value: l, label: l })),
          (v) => set({ language: v }),
        )}
        {dropdown(
          "Industry",
          filters.industry,
          INDUSTRY_OPTIONS.map((l) => ({ value: l, label: l })),
          (v) => set({ industry: v }),
        )}
        {dropdown(
          "Genre",
          filters.genre,
          GENRE_OPTIONS.map((l) => ({ value: l, label: l })),
          (v) => set({ genre: v }),
        )}
        {dropdown(
          "Year",
          filters.year ? String(filters.year) : undefined,
          YEARS.map((y) => ({ value: String(y), label: String(y) })),
          (v) => set({ year: v ? Number(v) : undefined }),
        )}
        {dropdown(
          "Rating",
          filters.minRating ? String(filters.minRating) : undefined,
          [9, 8, 7, 6, 5].map((r) => ({ value: String(r), label: `${r}+` })),
          (v) => set({ minRating: v ? Number(v) : undefined }),
        )}
        {dropdown(
          "Status",
          filters.status,
          [
            { value: "released", label: "Released" },
            { value: "upcoming", label: "Upcoming" },
          ],
          (v) => set({ status: v as MediaFilters["status"] }),
        )}
        {dropdown(
          "Sort",
          filters.sort,
          [
            { value: "popularity", label: "Popularity" },
            { value: "rating", label: "Rating" },
            { value: "newest", label: "Newest" },
          ],
          (v) => set({ sort: (v as MediaFilters["sort"]) ?? "popularity" }),
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-2xl" />
          ))}
        </div>
      ) : items.length ? (
        <>
          <MediaGrid items={items} />
          {items.length < total && (
            <div className="flex justify-center pt-2">
              <Button onClick={loadMore} disabled={loadingMore} variant="secondary" className="rounded-full">
                {loadingMore && <Loader2 className="size-4 animate-spin" aria-hidden />}
                Load more
              </Button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={<Compass className="size-6" aria-hidden />}
          title="Nothing matches those filters"
          description="Try a different language, genre or year — or request a title we don't have yet."
          ctaLabel="Request a title"
          ctaTo="/requests"
        />
      )}
    </div>
  );
}
