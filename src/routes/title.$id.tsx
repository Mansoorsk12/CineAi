import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { Bookmark, Check, ExternalLink, Heart, Play, Star } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Poster } from "@/components/Poster";
import { TitleRow } from "@/components/TitleRow";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { byId, imdbUrl } from "@/data/catalog";
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
    return {
      meta: [
        { title: `${t.title} (${t.year}) — CineAI` },
        { name: "description", content: desc },
        { property: "og:title", content: `${t.title} (${t.year}) — CineAI` },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: () => (
    <AppShell>
      <TitleDetails />
    </AppShell>
  ),
});

function TitleDetails() {
  const { title } = Route.useLoaderData();
  const lib = useLibrary();
  const imdb = imdbUrl(title);

  useEffect(() => {
    lib.markViewed(title.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title.id]);

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl cinema-panel">
        <div
          aria-hidden
          className="absolute inset-0 animate-cine-zoom opacity-55"
          style={{
            backgroundImage:
              "radial-gradient(70% 80% at 80% 10%, oklch(0.55 0.21 25 / 0.4), transparent 60%)",
          }}
        />
        <div className="relative grid gap-8 p-6 sm:p-10 md:grid-cols-[240px_1fr]">
          <Poster title={title} size="hero" className="aspect-[2/3] w-full rounded-2xl shadow-[var(--shadow-lift)]" />
          <div className="space-y-4">
            <Badge className="bg-primary text-primary-foreground uppercase">{title.kind}</Badge>
            <h1 className="font-display text-5xl leading-[0.95] sm:text-6xl">{title.title}</h1>
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
              <div className="flex gap-2">
                <dt className="font-semibold">Director:</dt>
                <dd>{title.director}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-semibold">Cast:</dt>
                <dd className="truncate">{title.cast.join(", ")}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button asChild>
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${title.title} ${title.year} trailer`)}`}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Play className="size-4" aria-hidden /> Watch trailer
                </a>
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
                <Button asChild variant="outline" className="border-white/30 text-cinema-foreground hover:bg-white/10">
                  <a href={imdb} target="_blank" rel="noreferrer noopener">
                    <ExternalLink className="size-4" aria-hidden /> View on IMDb
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <TitleRow title="You May Also Like" items={similarTo(title)} />

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
