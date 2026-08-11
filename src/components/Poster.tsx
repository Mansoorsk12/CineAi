import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Title } from "@/data/catalog";
import { posterUrl } from "@/data/media";

/**
 * Renders the exact poster for a title (resolved from its verified TMDB
 * record). While the image loads we show a deterministic cinematic gradient,
 * and if no poster is verified — or the image fails — that gradient stays as a
 * clean, titled fallback rather than showing another film's artwork.
 */
const PALETTES = [
  ["oklch(0.30 0.09 25)", "oklch(0.14 0.02 265)"],
  ["oklch(0.28 0.06 265)", "oklch(0.12 0.02 265)"],
  ["oklch(0.34 0.08 60)", "oklch(0.15 0.02 280)"],
  ["oklch(0.26 0.07 150)", "oklch(0.12 0.02 250)"],
  ["oklch(0.32 0.10 340)", "oklch(0.13 0.02 265)"],
  ["oklch(0.30 0.07 210)", "oklch(0.12 0.02 260)"],
];

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

export function Poster({
  title,
  className,
  size = "card",
  priority = false,
}: {
  title: Title;
  className?: string;
  size?: "card" | "hero";
  /** Above-the-fold posters skip lazy loading. */
  priority?: boolean;
}) {
  const pair = PALETTES[hash(title.id) % PALETTES.length]!;
  const angle = 120 + (hash(title.title) % 90);
  const src = posterUrl(title, size === "hero" ? "w500" : "w342");
  const [state, setState] = useState<"loading" | "ready" | "error">(src ? "loading" : "error");
  const showFallback = state !== "ready";

  return (
    <div
      className={cn("relative isolate overflow-hidden bg-cinema text-cinema-foreground", className)}
      style={{ backgroundImage: `linear-gradient(${angle}deg, ${pair[0]}, ${pair[1]})` }}
    >
      {src ? (
        <img
          src={src}
          alt={`${title.title} (${title.year}) ${title.kind === "series" ? "series" : "movie"} poster`}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          draggable={false}
          onLoad={() => setState("ready")}
          onError={() => setState("error")}
          className={cn(
            "absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500",
            state === "ready" ? "opacity-100" : "opacity-0",
          )}
        />
      ) : null}

      {showFallback ? (
        <>
          <div
            aria-hidden
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(120% 70% at 20% 0%, oklch(1 0 0 / 0.22), transparent 60%), radial-gradient(90% 60% at 100% 100%, oklch(0 0 0 / 0.55), transparent 70%)",
            }}
          />
          {state === "loading" ? (
            <div aria-hidden className="absolute inset-0 animate-pulse bg-black/10" />
          ) : null}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-2/3"
            style={{ backgroundImage: "var(--gradient-fade)" }}
          />
          <div className={cn("absolute inset-x-0 bottom-0 flex flex-col gap-1 p-3", size === "hero" && "p-6")}>
            <span
              className={cn(
                "font-display leading-[0.95] text-balance",
                size === "hero" ? "text-4xl" : "text-xl",
              )}
            >
              {title.title}
            </span>
            <span className="text-[11px] uppercase tracking-[0.18em] opacity-75">
              {title.language} · {title.year}
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
}
