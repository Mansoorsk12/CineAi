import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bookmark, Check, ExternalLink, Heart, Play, Star } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Poster } from "@/components/Poster";
import { TitleRow } from "@/components/TitleRow";
import { CastSection, PersonLink } from "@/components/CastSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { byId, imdbUrl } from "@/data/catalog";
import {
  backdropUrl,
  castOf,
  certificationOf,
  directorOf,
  hasVerifiedTrailer,
  originalTitleOf,
  posterUrl,
  studiosOf,
  taglineOf,
  writersOf,
} from "@/data/media";
import { openTrailer } from "@/data/media-actions";
import { useLibrary } from "@/lib/library";
import { similarTo } from "@/lib/recommend";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/title/$id")({
  loader: ({ params }) => {
    const title = byId(params.id);
    if (!title) throw notFound();
    return { title };
  },
  head: ({ loaderData }) => {
    if (!loaderData)
      return { meta: [{ title: "Title unavailable | CineAI" }, { name: "robots", content: "noindex" }] };
    const t = loaderData.title;
    const desc = `${t.title} (${t.year}) — ${t.genres.join(", ")} · ${t.language} · rated ${t.rating}. ${t.overview}`.slice(0, 155);
    const image = backdropUrl(t, "w1280") ?? posterUrl(t, "w500");
    return {
      meta: [
        { title: `${t.title} (${t.year}) — CineAI` },
        { name: "description", content: desc },
        { property: "og:title", content: `${t.title} (${t.year}) — CineAI` },
        { property: "og:description", content: desc },
        { property: "og:type", content: "video.movie" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(image
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
      ],
    };
  },
  component: () => (
    <AppShell>
      <TitleDetails />
    </AppShell>
  ),
});

function Backdrop({ src, alt }: { src: string; alt: string }) {
  const [ready, setReady] = useState(false);
  return (
    <img
      src={src}
      alt={alt}
      loading="eager"
      decoding="async"
      onLoad={() => setReady(true)}
      className={cn(
        "absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700",
        ready ? "opacity-40" : "opacity-0",
      )}
    />
  );
}

function TitleDetails() {
  const { title } = Route.useLoaderData();
  const lib = useLibrary();
  const imdb = imdbUrl(title);
  const cast = castOf(title);
  const director = directorOf(title);
  const writers = writersOf(title);
  const cert = certificationOf(title);
  const original = originalTitleOf(title);
  const tagline = taglineOf(title);
  const studios = studiosOf(title);
  const backdrop = backdropUrl(title);
  const verifiedTrailer = hasVerifiedTrailer(title);

  useEffect(() => {
    lib.markViewed(title.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title.id]);

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl cinema-panel">
        {backdrop ? <Backdrop src={backdrop} alt={`${title.title} backdrop`} /> : null}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to top, oklch(0.14 0.02 265 / 0.96), oklch(0.14 0.02 265 / 0.72) 55%, oklch(0.14 0.02 265 / 0.45))",
          }}
        />
        {!backdrop ? (
          <div
            aria-hidden
            className="absolute inset-0 animate-cine-zoom opacity-55"
            style={{
              backgroundImage:
                "radial-gradient(70% 80% at 80% 10%, oklch(0.55 0.21 25 / 0.4), transparent 60%)",
            }}
          />
        ) : null}
        <div className="relative grid gap-8 p-6 sm:p-10 md:grid-cols-[240px_1fr]">
          <Poster
            title={title}
            size="hero"
            priority
            className="aspect-[2/3] w-full max-w-[240px] rounded-2xl shadow-[var(--shadow-lift)]"
          />
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary text-primary-foreground uppercase">{title.kind}</Badge>
              {cert ? (
                <Badge variant="outline" className="border-white/40 text-cinema-foreground">
                  {cert}
                </Badge>
              ) : null}
              {title.hd ? (
                <Badge variant="outline" className="border-white/40 text-cinema-foreground">
                  HD
                </Badge>
              ) : null}
            </div>
            <h1 className="font-display text-5xl leading-[0.95] sm:text-6xl">{title.title}</h1>
            {original ? (
              <p className="text-sm text-cinema-foreground/70">Original title: {original}</p>
            ) : null}
            {tagline ? <p className="italic text-cinema-foreground/75">“{tagline}”</p> : null}
            <div className="flex flex-wrap items-center gap-2 text-sm text-cinema-foreground/80">
              <span className="inline-flex items-center gap-1 font-semibold">
                <Star className="size-4 fill-gold text-gold" aria-hidden /> {title.rating.toFixed(1)}
              </span>
              <span>· {title.year}</span>
              <span>· {title.runtime} min</span>
              <span>· {title.language}</span>
              {title.seasons ? <span>· {title.seasons} seasons, {title.episodes} episodes</span> : null}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {title.genres.map((g: string) => (
                <Badge key={g} variant="outline" className="border-white/30 text-cinema-foreground">
                  {g}
                </Badge>
              ))}
            </div>
            <p className="max-w-2xl text-cinema-foreground/80">{title.overview}</p>
            <dl className="grid gap-x-8 gap-y-1 text-sm text-cinema-foreground/75 sm:grid-cols-2">
              {director ? (
                <div className="flex gap-2">
                  <dt className="font-semibold">Director:</dt>
                  <dd>
                    {director.split(", ").map((n, i) => (
                      <span key={n}>
                        {i > 0 ? ", " : ""}
                        <PersonLink name={n} />
                      </span>
                    ))}
                  </dd>
                </div>
              ) : null}
              {writers.length ? (
                <div className="flex gap-2">
                  <dt className="font-semibold">Writers:</dt>
                  <dd>
                    {writers.map((n, i) => (
                      <span key={n}>
                        {i > 0 ? ", " : ""}
                        <PersonLink name={n} />
                      </span>
                    ))}
                  </dd>
                </div>
              ) : null}
              {studios.length ? (
                <div className="flex gap-2">
                  <dt className="font-semibold">Production:</dt>
                  <dd className="truncate">{studios.join(", ")}</dd>
                </div>
              ) : null}
            </dl>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={() => openTrailer(title)}>
                <Play className="size-4" aria-hidden />
                {verifiedTrailer ? "Watch trailer" : "Find trailer"}
              </Button>
              <Button variant="secondary" onClick={() => lib.toggleWatchlist(title.id)}>
                <Bookmark className="size-4" aria-hidden />
                {lib.inWatchlist(title.id) ? "In watchlist" : "Add to watchlist"}
              </Button>
              <Button variant="secondary" onClick={() => lib.toggleFavorite(title.id)}>
                <Heart
                  className={cn("size-4", lib.isFavorite(title.id) && "fill-primary text-primary")}
                  aria-hidden
                />
                Favourite
              </Button>
              <Button variant="secondary" onClick={() => lib.toggleWatched(title.id)}>
                <Check className="size-4" aria-hidden />
                {lib.isWatched(title.id) ? "Watched" : "Mark watched"}
              </Button>
              {imdb ? (
                <Button
                  asChild
                  className="bg-gold text-cinema hover:bg-gold/90 focus-visible:ring-gold"
                >
                  <a href={imdb} target="_blank" rel="noreferrer noopener">
                    <ExternalLink className="size-4" aria-hidden /> View on IMDb
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <CastSection cast={cast} />

      <TitleRow title="More Like This" subtitle="Similar titles in the CineAI catalog" items={similarTo(title)} />

      <p className="text-sm text-muted-foreground">
        Looking for something else?{" "}
        <Link to="/assistant" className="text-primary underline-offset-4 hover:underline">
          Ask the CineAI Assistant
        </Link>
        .
      </p>
    </div>
  );
}
