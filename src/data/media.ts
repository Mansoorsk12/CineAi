/**
 * Media resolution layer.
 *
 * Every visual/identity field (poster, backdrop, trailer, cast, IMDb id) is
 * read from the single verified TMDB record for a title — never guessed from
 * the title string — so a poster or trailer can never belong to another film.
 * When a record has no verified value we return null and callers render a
 * clean fallback instead of substituting something from a different movie.
 */
import { CATALOG, type Title } from "./catalog";
import { TMDB } from "./tmdb.generated";
import { tmdbBlur, tmdbImage, type CastMember, type TmdbRecord } from "./tmdb-types";

export type { CastMember, TmdbRecord };

export const mediaOf = (t: Title | string): TmdbRecord | undefined =>
  TMDB[typeof t === "string" ? t : t.id];

export const posterUrl = (t: Title, size: "w185" | "w342" | "w500" = "w342") =>
  tmdbImage(mediaOf(t)?.posterPath, size);

export const posterPlaceholder = (t: Title) => tmdbBlur(mediaOf(t)?.posterPath);

export const backdropUrl = (t: Title, size: "w780" | "w1280" | "original" = "w1280") =>
  tmdbImage(mediaOf(t)?.backdropPath, size);

export const profileUrl = (c: CastMember) => tmdbImage(c.profilePath, "w185");

/** Exact official trailer for this title, or null when none is verified. */
export const trailerUrl = (t: Title) => {
  const key = mediaOf(t)?.trailerKey;
  return key ? `https://www.youtube.com/watch?v=${key}` : null;
};

/** Fallback used only when no verified trailer exists — searches this exact title. */
export const trailerSearchUrl = (t: Title) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${t.title} ${t.year} ${t.language} official trailer`,
  )}`;

export const hasVerifiedTrailer = (t: Title) => Boolean(mediaOf(t)?.trailerKey);

/** Correct IMDb page, resolved from the verified TMDB record (not the title). */
export const imdbUrlFor = (t: Title) => {
  const id = mediaOf(t)?.imdbId;
  return id ? `https://www.imdb.com/title/${id}/` : null;
};

export const tmdbUrlFor = (t: Title) => {
  const m = mediaOf(t);
  return m ? `https://www.themoviedb.org/${m.tmdbType}/${m.tmdbId}` : null;
};

/** Billed cast with character names, straight from this title's own credits. */
export const castOf = (t: Title): CastMember[] => {
  const m = mediaOf(t);
  if (m?.cast?.length) return m.cast;
  // Fallback: catalog names only, no invented characters or photos.
  return t.cast.map((name) => ({ name, character: null, profilePath: null }));
};

export const directorOf = (t: Title) => mediaOf(t)?.director || t.director || null;
export const writersOf = (t: Title) => mediaOf(t)?.writers ?? [];
export const certificationOf = (t: Title) => mediaOf(t)?.certification ?? null;
export const originalTitleOf = (t: Title) => {
  const o = mediaOf(t)?.originalTitle;
  return o && o !== t.title ? o : null;
};
export const taglineOf = (t: Title) => mediaOf(t)?.tagline || null;
export const studiosOf = (t: Title) => mediaOf(t)?.productionCompanies ?? [];

/** Google search for the exact person clicked. */
export const personSearchUrl = (name: string) =>
  `https://www.google.com/search?q=${encodeURIComponent(name)}`;

/** All searchable text for a title, including its real credited cast. */
export const searchIndex = (t: Title) =>
  [
    t.title,
    originalTitleOf(t) ?? "",
    String(t.year),
    t.language,
    t.kind,
    directorOf(t) ?? "",
    ...writersOf(t),
    ...t.genres,
    ...(mediaOf(t)?.genres ?? []),
    ...castOf(t).flatMap((c) => [c.name, c.character ?? ""]),
  ]
    .join(" ")
    .toLowerCase();

/** People who appear across the catalog — used by search suggestions. */
export const ALL_PEOPLE = Array.from(
  new Set(CATALOG.flatMap((t) => castOf(t).map((c) => c.name))),
);
