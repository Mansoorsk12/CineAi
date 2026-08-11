import { useState } from "react";
import { Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CastMember } from "@/data/media";
import { profileUrl } from "@/data/media";
import { openPersonSearch } from "@/data/media-actions";

function Avatar({ person }: { person: CastMember }) {
  const src = profileUrl(person);
  const [ok, setOk] = useState(Boolean(src));
  return (
    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-muted">
      {src && ok ? (
        <img
          src={src}
          alt={`${person.name} headshot`}
          loading="lazy"
          decoding="async"
          onError={() => setOk(false)}
          className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          <User className="size-8" aria-hidden />
        </div>
      )}
      <div className="absolute inset-0 flex items-end justify-center bg-cinema/60 p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-cinema-foreground">
          <Search className="size-3" aria-hidden /> Search
        </span>
      </div>
    </div>
  );
}

/**
 * Cast for one specific title. Names and characters come from that title's own
 * credits; clicking a person opens a Google search for that exact name.
 */
export function CastSection({
  cast,
  className,
}: {
  cast: CastMember[];
  className?: string;
}) {
  if (!cast.length) return null;
  return (
    <section className={cn("space-y-4", className)} aria-labelledby="cast-heading">
      <div>
        <h2 id="cast-heading" className="font-display text-2xl sm:text-3xl">
          Cast
        </h2>
        <p className="text-sm text-muted-foreground">Tap a name to search the web for them.</p>
      </div>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {cast.map((person) => (
          <li key={`${person.name}-${person.character ?? ""}`}>
            <button
              type="button"
              onClick={() => openPersonSearch(person.name)}
              aria-label={`Search the web for ${person.name}`}
              className="group block w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Avatar person={person} />
              <p className="mt-2 truncate text-sm font-medium group-hover:text-primary">{person.name}</p>
              {person.character ? (
                <p className="truncate text-xs text-muted-foreground">{person.character}</p>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Inline clickable person name (director, writers). */
export function PersonLink({ name }: { name: string }) {
  return (
    <button
      type="button"
      onClick={() => openPersonSearch(name)}
      className="underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Search the web for ${name}`}
    >
      {name}
    </button>
  );
}
