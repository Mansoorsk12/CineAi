import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Clock, ExternalLink, Play, Star } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShareButton } from "@/components/ShareButton";
import { tmdbImage } from "@/data/tmdb-types";
import { getReleaseById } from "@/lib/releases.functions";
import {
  formatReleaseDate,
  releaseImdbUrl,
  releaseTmdbUrl,
  releaseTrailerUrl,
} from "@/lib/releases-shared";
import { personSearchUrl } from "@/data/media";

export const Route = createFileRoute("/release/$tmdbId")({
  head: () => ({
    meta: [
      { title: "New Release | CineAI" },
      {
        name: "description",
        content: "Details, trailer, cast and streaming availability for the latest release on CineAI.",
      },
      { property: "og:title", content: "New Release | CineAI" },
      {
        property: "og:description",
        content: "Trailer, cast and where to watch the newest theatre and OTT releases.",
      },
      { property: "og:type", content: "video.movie" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <ReleasePage />
    </AppShell>
  ),
  errorComponent: ({ error }) => (
    <div role="alert" className="p-6 text-sm text-muted-foreground">
      {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-6 text-sm text-muted-foreground">Release not found.</div>,
});

const openTab = (url: string) => {
  if (typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer");
};

function ReleasePage() {
  const { tmdbId } = Route.useParams();
  const fetchRelease = useServerFn(getReleaseById);
  const { data, isLoading } = useQuery({
    queryKey: ["release", tmdbId],
    queryFn: () => fetchRelease({ data: { tmdbId: Number(tmdbId) } }),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-3">
        <h1 className="font-display text-3xl">Release not found</h1>
        <p className="text-sm text-muted-foreground">
          This title may have been removed from the current releases feed.
        </p>
        <Button asChild variant="outline">
          <Link to="/">Back home</Link>
        </Button>
      </div>
    );
  }

  const backdrop = tmdbImage(data.backdropPath, "w1280");
  const poster = tmdbImage(data.posterPath, "w500");
  const imdb = releaseImdbUrl(data);
  const isOtt = data.releaseType === "ott";

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border">
        {backdrop ? (
          <img src={backdrop} alt="" className="h-[280px] w-full object-cover sm:h-[380px]" />
        ) : (
          <div className="h-[220px] w-full bg-secondary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-cinema/95 via-cinema/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end gap-4 p-5 sm:p-8">
          {poster ? (
            <img
              src={poster}
              alt={`${data.title} poster`}
              className="hidden w-32 rounded-2xl border shadow-lg sm:block"
            />
          ) : null}
          <div className="min-w-0 space-y-3 text-cinema-foreground">
            <div className="flex flex-wrap gap-2">
              <Badge className={isOtt ? "bg-gold text-cinema" : "bg-primary text-primary-foreground"}>
                {isOtt ? "OTT" : "THEATRE"}
              </Badge>
              <Badge className="gap-1 bg-cinema/80 text-cinema-foreground">
                <Star className="size-3 fill-gold text-gold" aria-hidden />
                {data.rating.toFixed(1)}
              </Badge>
              {data.runtime ? (
                <Badge variant="outline" className="gap-1 border-white/40 text-cinema-foreground">
                  <Clock className="size-3" aria-hidden /> {data.runtime}m
                </Badge>
              ) : null}
            </div>
            <h1 className="font-display text-3xl sm:text-5xl">{data.title}</h1>
            <p className="text-sm opacity-90">
              {formatReleaseDate(data.releaseDate)}
              {data.language ? ` · ${data.language}` : ""}
              {data.genres.length ? ` · ${data.genres.join(", ")}` : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => openTab(releaseTrailerUrl(data))} className="gap-2">
                <Play className="size-4" aria-hidden /> Watch Trailer
              </Button>
              {imdb ? (
                <Button
                  variant="secondary"
                  className="gap-2 bg-gold text-cinema hover:bg-gold/90"
                  onClick={() => openTab(imdb)}
                >
                  <ExternalLink className="size-4" aria-hidden /> View on IMDb
                </Button>
              ) : null}
              <Button variant="outline" className="gap-2 text-cinema-foreground" onClick={() => openTab(releaseTmdbUrl(data))}>
                <ExternalLink className="size-4" aria-hidden /> TMDB
              </Button>
              <ShareButton title={data.title} />
            </div>
          </div>
        </div>
      </section>

      {data.overview ? (
        <section className="max-w-3xl space-y-2">
          <h2 className="font-display text-2xl">Overview</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{data.overview}</p>
          {data.director ? (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Director:</span> {data.director}
            </p>
          ) : null}
        </section>
      ) : null}

      {data.providers.length ? (
        <section className="space-y-3">
          <h2 className="font-display text-2xl">Where to watch</h2>
          <div className="flex flex-wrap gap-3">
            {data.providers.map((p) => (
              <div key={p.name} className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2">
                {p.logoPath ? (
                  <img src={tmdbImage(p.logoPath, "w185") ?? ""} alt="" className="size-6 rounded" />
                ) : null}
                <span className="text-sm">{p.name}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {data.cast.length ? (
        <section className="space-y-3">
          <h2 className="font-display text-2xl">Cast</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {data.cast.map((c) => (
              <button
                key={`${c.name}-${c.character ?? ""}`}
                onClick={() => openTab(personSearchUrl(c.name))}
                className="rounded-2xl border bg-card p-2 text-left transition-colors hover:bg-secondary"
              >
                <div className="mb-2 aspect-[2/3] overflow-hidden rounded-xl bg-secondary">
                  {c.profilePath ? (
                    <img
                      src={tmdbImage(c.profilePath, "w185") ?? ""}
                      alt={c.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <p className="truncate text-xs font-medium">{c.name}</p>
                {c.character ? (
                  <p className="truncate text-[11px] text-muted-foreground">{c.character}</p>
                ) : null}
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
