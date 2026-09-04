import { Link } from "@tanstack/react-router";
import { Star, Tv, Film } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TMDB_IMAGE, type MediaItem } from "@/lib/media-types";

/** Card for a database-backed catalogue record (media_items). */
export function MediaCard({ item, priority = false }: { item: MediaItem; priority?: boolean }) {
  const src = TMDB_IMAGE(item.poster_path, "w342");
  const [failed, setFailed] = useState(false);
  const isSeries = item.media_type === "tv";

  return (
    <Link
      to="/media/$type/$tmdbId"
      params={{ type: item.media_type, tmdbId: String(item.tmdb_id) }}
      className="group block overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-cinema text-cinema-foreground">
        {src && !failed ? (
          <img
            src={src}
            alt={`${item.title} ${isSeries ? "series" : "movie"} poster`}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            onError={() => setFailed(true)}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-secondary to-muted p-3 text-center text-xs font-medium text-muted-foreground">
            {item.title}
          </div>
        )}
        <Badge className="absolute left-2 top-2 gap-1 rounded-full" variant="secondary">
          {isSeries ? <Tv className="size-3" aria-hidden /> : <Film className="size-3" aria-hidden />}
          {isSeries ? "Series" : "Movie"}
        </Badge>
        {item.rating > 0 && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-background/85 px-2 py-0.5 text-xs font-semibold backdrop-blur">
            <Star className="size-3 fill-current text-primary" aria-hidden />
            {item.rating.toFixed(1)}
          </span>
        )}
      </div>
      <div className="space-y-1 p-3">
        <h3 className="line-clamp-1 text-sm font-semibold">{item.title}</h3>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {[item.year ?? "—", item.language, item.industry].filter(Boolean).join(" • ")}
        </p>
      </div>
    </Link>
  );
}

export function MediaGrid({ items, className }: { items: MediaItem[]; className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6",
        className,
      )}
    >
      {items.map((item, i) => (
        <MediaCard key={`${item.media_type}-${item.tmdb_id}`} item={item} priority={i < 6} />
      ))}
    </div>
  );
}
