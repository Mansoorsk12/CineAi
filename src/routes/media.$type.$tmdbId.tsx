import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Clock, ExternalLink, Play, Star, Tv } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MediaGrid } from "@/components/MediaCard";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getMediaDetail } from "@/lib/discovery.functions";
import { TMDB_IMAGE } from "@/lib/media-types";

export const Route = createFileRoute("/media/$type/$tmdbId")({
  head: () => ({
    meta: [
      { title: "Title Details | CineAI" },
      {
        name: "description",
        content:
          "Full details for this movie or series: cast, director, trailer, genres, ratings and IMDb information.",
      },
      { property: "og:title", content: "Title Details | CineAI" },
      {
        property: "og:description",
        content: "Cast, director, trailer, genres, ratings and IMDb information.",
      },
      { property: "og:type", content: "video.movie" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <MediaDetailPage />
    </AppShell>
  ),
});

function MediaDetailPage() {
  const { type, tmdbId } = Route.useParams();
  const run = useServerFn(getMediaDetail);
  const mediaType = type === "tv" ? "tv" : "movie";

  const { data, isLoading } = useQuery({
    queryKey: ["media-detail", mediaType, tmdbId],
    queryFn: () => run({ data: { type: mediaType as "movie" | "tv", tmdbId: Number(tmdbId) } }),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-72 w-full rounded-3xl" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  const item = data?.item;
  if (!item) {
    return (
      <EmptyState
        icon={<Tv className="size-6" aria-hidden />}
        title="Title not found"
        description="We couldn't find this title in the catalogue. You can request it and we'll add it."
        ctaLabel="Request this title"
        ctaTo="/requests"
      />
    );
  }

  const backdrop = TMDB_IMAGE(item.backdrop_path, "w1280");
  const poster = TMDB_IMAGE(item.poster_path, "w500");
  const trailer = item.trailer_key
    ? `https://www.youtube.com/watch?v=${item.trailer_key}`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(
        `${item.title} ${item.year ?? ""} ${item.language} official trailer`,
      )}`;

  return (
    <article className="space-y-8">
      <header className="relative overflow-hidden rounded-3xl border bg-cinema text-cinema-foreground">
        {backdrop && (
          <img
            src={backdrop}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
        )}
        <div className="relative grid gap-6 p-6 sm:p-8 md:grid-cols-[220px_1fr]">
          <div className="mx-auto w-40 overflow-hidden rounded-2xl border md:mx-0 md:w-full">
            {poster ? (
              <img src={poster} alt={`${item.title} poster`} className="w-full" />
            ) : (
              <div className="aspect-[2/3] bg-secondary" />
            )}
          </div>
          <div className="space-y-3">
            <h1 className="font-display text-3xl sm:text-4xl">{item.title}</h1>
            {item.original_title && item.original_title !== item.title && (
              <p className="text-sm opacity-80">Original title: {item.original_title}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="secondary" className="rounded-full">
                {item.media_type === "tv" ? "Series" : "Movie"}
              </Badge>
              {item.rating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="size-4 fill-current text-primary" aria-hidden />
                  {item.rating.toFixed(1)} ({item.vote_count} votes)
                </span>
              )}
              {item.release_date && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="size-4" aria-hidden />
                  {new Date(item.release_date).toLocaleDateString()}
                </span>
              )}
              {item.runtime ? (
                <span className="flex items-center gap-1">
                  <Clock className="size-4" aria-hidden /> {item.runtime} min
                </span>
              ) : null}
              {item.status && <span className="opacity-80">{item.status}</span>}
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline" className="rounded-full">{item.language}</Badge>
              <Badge variant="outline" className="rounded-full">{item.industry}</Badge>
              {item.country && (
                <Badge variant="outline" className="rounded-full">{item.country}</Badge>
              )}
              {item.genres.map((g) => (
                <Badge key={g} variant="outline" className="rounded-full">
                  {g}
                </Badge>
              ))}
            </div>
            {item.media_type === "tv" && (item.seasons || item.episodes) && (
              <p className="text-sm opacity-90">
                {item.seasons ?? 0} season{item.seasons === 1 ? "" : "s"} •{" "}
                {item.episodes ?? 0} episodes
              </p>
            )}
            {item.director && <p className="text-sm opacity-90">Director: {item.director}</p>}
            <p className="max-w-3xl text-sm leading-relaxed opacity-95">{item.overview}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild className="rounded-full">
                <a href={trailer} target="_blank" rel="noreferrer">
                  <Play className="size-4" aria-hidden /> Watch Trailer
                </a>
              </Button>
              {item.imdb_id && (
                <Button asChild variant="secondary" className="rounded-full">
                  <a
                    href={`https://www.imdb.com/title/${item.imdb_id}/`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="size-4" aria-hidden /> View on IMDb
                  </a>
                </Button>
              )}
              <Button asChild variant="secondary" className="rounded-full">
                <a
                  href={`https://www.themoviedb.org/${item.media_type}/${item.tmdb_id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="size-4" aria-hidden /> View on TMDB
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {item.cast_members.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-2xl">Cast</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {item.cast_members.slice(0, 18).map((c) => (
              <a
                key={`${c.name}-${c.character ?? ""}`}
                href={`https://www.google.com/search?q=${encodeURIComponent(`${c.name} actor`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-2xl border bg-card p-2 transition-colors hover:bg-secondary"
              >
                <span className="size-10 shrink-0 overflow-hidden rounded-full bg-secondary">
                  {TMDB_IMAGE(c.profilePath, "w185") && (
                    <img
                      src={TMDB_IMAGE(c.profilePath, "w185")!}
                      alt={c.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{c.name}</span>
                  {c.character && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {c.character}
                    </span>
                  )}
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      {(data?.similar?.length ?? 0) > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-2xl">More in {item.language}</h2>
          <MediaGrid items={data!.similar} />
        </section>
      )}

      <p className="text-sm text-muted-foreground">
        Missing something?{" "}
        <Link to="/requests" className="underline">
          Request a movie or series
        </Link>
        .
      </p>
    </article>
  );
}
