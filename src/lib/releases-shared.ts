/**
 * Shared (client-safe) types for the auto-updating TMDB release feed.
 * Kept separate from the server fetcher so components never pull server code.
 */
import type { CastMember } from "@/data/tmdb-types";

export type ReleaseType = "theatre" | "ott";

export interface ReleaseProvider {
  name: string;
  logoPath: string | null;
}

export interface ReleaseItem {
  tmdbId: number;
  releaseType: ReleaseType;
  title: string;
  releaseDate: string | null;
  rating: number;
  genres: string[];
  language: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  trailerKey: string | null;
  imdbId: string | null;
  runtime: number | null;
  director: string | null;
  cast: CastMember[];
  providers: ReleaseProvider[];
  featured: boolean;
  createdAt?: string;
  hidden?: boolean;
}

export const releaseYear = (r: ReleaseItem) =>
  r.releaseDate ? Number(r.releaseDate.slice(0, 4)) : new Date().getFullYear();

export const formatReleaseDate = (date: string | null) =>
  date
    ? new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Release date TBA";

/** Exact trailer for this release, or a title-scoped YouTube search. */
export const releaseTrailerUrl = (r: ReleaseItem) =>
  r.trailerKey && /^[\w-]{11}$/.test(r.trailerKey)
    ? `https://www.youtube.com/watch?v=${r.trailerKey}`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(
        [r.title, releaseYear(r), "official trailer"].join(" "),
      )}`;

export const releaseImdbUrl = (r: ReleaseItem) =>
  r.imdbId ? `https://www.imdb.com/title/${r.imdbId}/` : null;

export const releaseTmdbUrl = (r: ReleaseItem) => `https://www.themoviedb.org/movie/${r.tmdbId}`;
