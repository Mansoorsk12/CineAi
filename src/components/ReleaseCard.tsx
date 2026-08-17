import { Link } from "@tanstack/react-router";
import { Info, Play, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { tmdbImage } from "@/data/tmdb-types";
import { formatReleaseDate, releaseTrailerUrl, type ReleaseItem } from "@/lib/releases-shared";
import { cn } from "@/lib/utils";

const openTab = (url: string) => {
  if (typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer");
};

export function ReleaseCard({ item, className }: { item: ReleaseItem; className?: string }) {
  const poster = tmdbImage(item.posterPath, "w342");
  const isOtt = item.releaseType === "ott";
  const provider = item.providers[0];

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]",
        className,
      )}
    >
      <Link
        to="/release/$tmdbId"
        params={{ tmdbId: String(item.tmdbId) }}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`${item.title} details`}
      >
        <div className="relative aspect-[2/3] overflow-hidden bg-secondary">
          {poster ? (
            <img
              src={poster}
              alt={`${item.title} poster`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : null}
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            <Badge className="gap-1 bg-cinema/85 text-cinema-foreground backdrop-blur">
              <Star className="size-3 fill-gold text-gold" aria-hidden />
              {item.rating.toFixed(1)}
            </Badge>
          </div>
          <div className="absolute right-2 top-2">
            <Badge
              className={cn(
                "font-semibold tracking-wide backdrop-blur",
                isOtt ? "bg-gold text-cinema" : "bg-primary text-primary-foreground",
              )}
            >
              {isOtt ? "OTT" : "THEATRE"}
            </Badge>
          </div>
        </div>
      </Link>

      <div className="space-y-1.5 p-3">
        <h3 className="truncate text-sm font-semibold" title={item.title}>
          {item.title}
        </h3>
        <p className="text-xs text-muted-foreground">{formatReleaseDate(item.releaseDate)}</p>
        <p className="truncate text-xs text-muted-foreground">
          {item.genres.slice(0, 2).join(" · ") || item.language || "Movie"}
        </p>
        {isOtt ? (
          <div className="flex items-center gap-1.5 pt-0.5">
            {provider?.logoPath ? (
              <img
                src={tmdbImage(provider.logoPath, "w185") ?? ""}
                alt={provider.name}
                loading="lazy"
                className="size-5 rounded"
              />
            ) : null}
            <span className="truncate text-xs text-muted-foreground">
              {provider?.name ?? "OTT"}
            </span>
          </div>
        ) : null}

        <div className="flex gap-1.5 pt-1">
          <Button
            size="sm"
            className="h-8 flex-1 gap-1 px-2 text-xs"
            onClick={() => openTab(releaseTrailerUrl(item))}
          >
            <Play className="size-3.5" aria-hidden /> Trailer
          </Button>
          <Button asChild size="sm" variant="outline" className="h-8 flex-1 gap-1 px-2 text-xs">
            <Link to="/release/$tmdbId" params={{ tmdbId: String(item.tmdbId) }}>
              <Info className="size-3.5" aria-hidden /> Details
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

export function ReleaseRow({ items }: { items: ReleaseItem[] }) {
  if (!items.length) return null;
  return (
    <div className="scroll-row -mx-1 px-1">
      {items.map((item) => (
        <ReleaseCard
          key={item.tmdbId}
          item={item}
          className="scroll-row-item w-[160px] sm:w-[184px] lg:w-[200px]"
        />
      ))}
    </div>
  );
}
