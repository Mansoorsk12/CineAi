import { Link } from "@tanstack/react-router";
import { Bookmark, BookmarkCheck, Check, Heart, Star } from "lucide-react";
import { Poster } from "./Poster";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLibrary } from "@/lib/library";
import type { Title } from "@/data/catalog";

export function TitleCard({ title, className }: { title: Title; className?: string }) {
  const lib = useLibrary();
  const fav = lib.isFavorite(title.id);
  const listed = lib.inWatchlist(title.id);
  const watched = lib.isWatched(title.id);

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]",
        className,
      )}
    >
      <Link
        to="/title/$id"
        params={{ id: title.id }}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`${title.title} details`}
      >
        <div className="relative aspect-[2/3] overflow-hidden">
          <Poster
            title={title}
            className="h-full w-full transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute left-2 top-2 flex gap-1">
            <Badge className="gap-1 bg-cinema/85 text-cinema-foreground backdrop-blur">
              <Star className="size-3 fill-gold text-gold" aria-hidden />
              {title.rating.toFixed(1)}
            </Badge>
            {title.hd ? (
              <Badge variant="outline" className="border-white/40 bg-cinema/70 text-cinema-foreground">
                HD
              </Badge>
            ) : null}
          </div>
          {watched ? (
            <Badge className="absolute right-2 top-2 gap-1 bg-primary text-primary-foreground">
              <Check className="size-3" aria-hidden /> Watched
            </Badge>
          ) : null}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-3 p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <p className="line-clamp-3 text-xs text-cinema-foreground/90">{title.overview}</p>
          </div>
        </div>
      </Link>

      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold">{title.title}</h3>
            <p className="truncate text-xs text-muted-foreground">
              {title.year} · {title.genres.slice(0, 2).join(", ")} · {title.language}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            aria-pressed={fav}
            aria-label={fav ? "Remove from favourites" : "Add to favourites"}
            title={fav ? "Remove from favourites" : "Add to favourites"}
            onClick={() => lib.toggleFavorite(title.id)}
            className="size-8"
          >
            <Heart
              className={cn("size-4", fav && "animate-cine-pop fill-primary text-primary")}
              aria-hidden
            />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-pressed={listed}
            aria-label={listed ? "Remove from watchlist" : "Add to watchlist"}
            title={listed ? "Remove from watchlist" : "Add to watchlist"}
            onClick={() => lib.toggleWatchlist(title.id)}
            className="size-8"
          >
            {listed ? (
              <BookmarkCheck className="size-4 animate-cine-pop text-primary" aria-hidden />
            ) : (
              <Bookmark className="size-4" aria-hidden />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-pressed={watched}
            aria-label={watched ? "Unmark watched" : "Mark as watched"}
            title={watched ? "Unmark watched" : "Mark as watched"}
            onClick={() => lib.toggleWatched(title.id)}
            className="size-8"
          >
            <Check className={cn("size-4", watched && "text-primary")} aria-hidden />
          </Button>
        </div>
      </div>
    </article>
  );
}

export function TitleGrid({ items }: { items: Title[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {items.map((t) => (
        <TitleCard key={t.id} title={t} />
      ))}
    </div>
  );
}
