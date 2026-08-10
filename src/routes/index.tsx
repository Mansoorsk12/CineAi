import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bookmark, Heart, Info, Play, Sparkles, Star } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Poster } from "@/components/Poster";
import { TitleRow, Section } from "@/components/TitleRow";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CATALOG, type Title } from "@/data/catalog";
import { useLibrary } from "@/lib/library";
import { recommend, reasonFor } from "@/lib/recommend";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CineAI — AI Movie & Series Recommendations" },
      {
        name: "description",
        content:
          "Discover movies and series with AI-personalised picks, a rich Telugu cinema collection, watchlists, favourites and viewing analytics.",
      },
      { property: "og:title", content: "CineAI — AI Movie & Series Recommendations" },
      {
        property: "og:description",
        content:
          "Discover movies and series with AI-personalised picks, a rich Telugu cinema collection, watchlists, favourites and viewing analytics.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <HomePage />
    </AppShell>
  ),
});

const movies = CATALOG.filter((t) => t.kind === "movie");
const series = CATALOG.filter((t) => t.kind === "series");
const byGenre = (g: string, list = movies) => list.filter((t) => t.genres.includes(g));
const telugu = CATALOG.filter((t) => t.language === "Telugu");

const HERO = [
  CATALOG.find((t) => t.id === "rrr")!,
  CATALOG.find((t) => t.id === "kalki-2898")!,
  CATALOG.find((t) => t.id === "interstellar")!,
  CATALOG.find((t) => t.id === "hanu-man")!,
];

function HomePage() {
  const lib = useLibrary();
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setHeroIndex((i) => (i + 1) % HERO.length), 9000);
    return () => clearInterval(id);
  }, []);

  const aiPicks = useMemo(
    () =>
      recommend(
        {
          favorites: lib.favorites,
          watchlist: lib.watchlist,
          watched: lib.watched,
          recentlyViewed: lib.recentlyViewed,
          searchHistory: lib.searchHistory,
          preferences: lib.preferences,
          targets: lib.targets,
          notifications: lib.notifications,
        },
        12,
      ),
    [lib.favorites, lib.watchlist, lib.watched, lib.recentlyViewed, lib.preferences, lib.searchHistory, lib.targets, lib.notifications],
  );

  const recent = lib.recentlyViewed
    .map((id) => CATALOG.find((t) => t.id === id))
    .filter((t): t is Title => Boolean(t));

  const hero = HERO[heroIndex]!;

  return (
    <div className="space-y-12">
      <Hero title={hero} index={heroIndex} onSelect={setHeroIndex} />

      <GoalPanel />

      <TitleRow title="Trending Now" items={[...movies].sort((a, b) => b.popularity - a.popularity).slice(0, 12)} />

      <TitleRow
        title="AI Picks For You"
        subtitle={
          aiPicks[0]
            ? reasonFor(aiPicks[0], {
                favorites: lib.favorites,
                watchlist: lib.watchlist,
                watched: lib.watched,
                recentlyViewed: lib.recentlyViewed,
                searchHistory: lib.searchHistory,
                preferences: lib.preferences,
                targets: lib.targets,
                notifications: lib.notifications,
              })
            : "Tuned to your favourites, watchlist and preferences."
        }
        items={aiPicks}
        action={
          <Button asChild variant="outline" size="sm">
            <Link to="/assistant">
              <Sparkles className="size-4" aria-hidden /> Ask CineAI
            </Link>
          </Button>
        }
      />

      <TitleRow title="Popular Movies" items={[...movies].sort((a, b) => b.popularity - a.popularity).slice(4, 16)} />
      <TitleRow title="New Releases" items={[...movies].sort((a, b) => b.year - a.year).slice(0, 12)} />

      <Section
        title="Best of Telugu Cinema"
        subtitle="Blockbusters, classics and new releases from Tollywood"
        action={
          <Button asChild variant="outline" size="sm">
            <Link to="/movies">
              View all Telugu movies
            </Link>
          </Button>
        }
      >
        <div className="space-y-8">
          <SubRow label="Telugu Blockbusters" items={telugu.filter((t) => t.popularity >= 78)} />
          <SubRow label="Telugu Classics" items={telugu.filter((t) => t.year < 2005)} />
          <SubRow label="New Telugu Releases" items={telugu.filter((t) => t.year >= 2023)} />
          <SubRow label="Telugu Action" items={byGenre("Action", telugu)} />
          <SubRow label="Telugu Romance" items={byGenre("Romance", telugu)} />
          <SubRow label="Telugu Comedy" items={byGenre("Comedy", telugu)} />
          <SubRow label="Telugu Thrillers" items={byGenre("Thriller", telugu)} />
          <SubRow label="Telugu Family" items={byGenre("Family", telugu)} />
          <SubRow label="Telugu Sci-Fi & Fantasy" items={telugu.filter((t) => t.genres.some((g) => g === "Sci-Fi" || g === "Fantasy" || g === "Mythological"))} />
        </div>
      </Section>

      <TitleRow title="Top Rated Movies" items={[...movies].sort((a, b) => b.rating - a.rating).slice(0, 12)} />
      <TitleRow title="Popular Series" items={[...series].sort((a, b) => b.popularity - a.popularity)} />
      <TitleRow title="Telugu Series" items={series.filter((t) => t.language === "Telugu")} />
      <TitleRow title="Action & Adventure" items={byGenre("Action")} />
      <TitleRow title="Thriller" items={byGenre("Thriller")} />
      <TitleRow title="Romance" items={byGenre("Romance")} />
      <TitleRow title="Comedy" items={byGenre("Comedy")} />
      <TitleRow title="Sci-Fi" items={byGenre("Sci-Fi")} />
      <TitleRow title="Horror" items={byGenre("Horror")} />
      <TitleRow title="Animation" items={byGenre("Animation")} />
      <TitleRow title="Recently Viewed" items={recent} />
    </div>
  );
}

function SubRow({ label, items }: { label: string; items: Title[] }) {
  if (!items.length) return null;
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </h3>
      <div className="scroll-row -mx-1 px-1">
        {items.map((t) => (
          <Link
            key={t.id}
            to="/title/$id"
            params={{ id: t.id }}
            className="scroll-row-item w-[132px] overflow-hidden rounded-xl border shadow-[var(--shadow-card)] transition-transform hover:-translate-y-1 sm:w-[150px]"
          >
            <Poster title={t} className="aspect-[2/3] w-full" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function Hero({
  title,
  index,
  onSelect,
}: {
  title: Title;
  index: number;
  onSelect: (i: number) => void;
}) {
  const lib = useLibrary();
  return (
    <section className="relative overflow-hidden rounded-3xl cinema-panel">
      <div
        key={title.id}
        aria-hidden
        className="absolute inset-0 animate-cine-zoom opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(70% 80% at 75% 20%, oklch(0.55 0.21 25 / 0.42), transparent 62%), radial-gradient(60% 70% at 10% 90%, oklch(0.6 0.09 250 / 0.3), transparent 65%)",
        }}
      />
      <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_280px] lg:items-center">
        <div key={title.id + "-copy"} className="animate-cine-rise space-y-4">
          <Badge className="bg-primary text-primary-foreground">Featured today</Badge>
          <h1 className="font-display text-5xl leading-[0.95] sm:text-6xl lg:text-7xl">
            {title.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-cinema-foreground/80">
            <span className="inline-flex items-center gap-1 font-semibold">
              <Star className="size-4 fill-gold text-gold" aria-hidden /> {title.rating.toFixed(1)} IMDb
            </span>
            <span>· {title.year}</span>
            <span>· {title.runtime} min</span>
            <span>· {title.language}</span>
            <span>· {title.genres.join(", ")}</span>
          </div>
          <p className="max-w-xl text-cinema-foreground/80">{title.overview}</p>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button asChild>
              <Link to="/title/$id" params={{ id: title.id }}>
                <Play className="size-4" aria-hidden /> Watch trailer
              </Link>
            </Button>
            <Button
              variant="secondary"
              onClick={() => lib.toggleWatchlist(title.id)}
              aria-pressed={lib.inWatchlist(title.id)}
            >
              <Bookmark className="size-4" aria-hidden />
              {lib.inWatchlist(title.id) ? "In watchlist" : "Add to watchlist"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => lib.toggleFavorite(title.id)}
              aria-pressed={lib.isFavorite(title.id)}
            >
              <Heart
                className={cn("size-4", lib.isFavorite(title.id) && "fill-primary text-primary")}
                aria-hidden
              />
              Favourite
            </Button>
            <Button variant="ghost" asChild className="text-cinema-foreground hover:bg-white/10">
              <Link to="/title/$id" params={{ id: title.id }}>
                <Info className="size-4" aria-hidden /> View details
              </Link>
            </Button>
          </div>
          <div className="flex gap-1.5 pt-4">
            {HERO.map((h, i) => (
              <button
                key={h.id}
                onClick={() => onSelect(i)}
                aria-label={`Show ${h.title}`}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-8 bg-primary" : "w-3 bg-white/35",
                )}
              />
            ))}
          </div>
        </div>
        <Poster
          key={title.id + "-poster"}
          title={title}
          size="hero"
          className="hidden aspect-[2/3] w-full animate-cine-rise rounded-2xl shadow-[var(--shadow-lift)] lg:block"
        />
      </div>
    </section>
  );
}

function GoalPanel() {
  const lib = useLibrary();
  const now = new Date();
  const thisMonth = lib.watched.filter((w) => {
    const d = new Date(w.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const watchedTitles = thisMonth
    .map((w) => CATALOG.find((t) => t.id === w.id))
    .filter((t): t is Title => Boolean(t));
  const moviesDone = watchedTitles.filter((t) => t.kind === "movie").length;
  const seriesDone = watchedTitles.filter((t) => t.kind === "series").length;
  const hours = Math.round(watchedTitles.reduce((s, t) => s + t.runtime, 0) / 60);
  const pct = (a: number, b: number) => Math.min(100, b ? Math.round((a / b) * 100) : 0);

  return (
    <Section title="Your Entertainment Goal" subtitle="Gentle monthly targets — no streaks, no pressure.">
      <div className="grid gap-4 sm:grid-cols-3">
        <GoalCard label="Movies" value={moviesDone} target={lib.targets.movies} unit="movies" />
        <GoalCard label="Series" value={seriesDone} target={lib.targets.series} unit="series" />
        <GoalCard label="Watch time" value={hours} target={lib.targets.hours} unit="hours" />
      </div>
      <p className="text-sm text-muted-foreground">
        You're {pct(moviesDone, lib.targets.movies)}% toward your monthly movie goal. Adjust targets
        in <Link to="/profile" className="text-primary underline-offset-4 hover:underline">your profile</Link>.
      </p>
    </Section>
  );
}

function GoalCard({
  label,
  value,
  target,
  unit,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
}) {
  const pct = Math.min(100, target ? Math.round((value / target) * 100) : 0);
  return (
    <div className="space-y-3 rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="font-display text-2xl">
          {value}
          <span className="text-base text-muted-foreground">/{target}</span>
        </span>
      </div>
      <Progress value={pct} />
      <p className="text-xs text-muted-foreground">
        {pct}% of your monthly {unit} target
      </p>
    </div>
  );
}
