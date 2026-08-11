/** Types for the auto-generated TMDB dataset (see scripts/enrich-tmdb.mjs). */

export interface CastMember {
  name: string;
  character: string | null;
  profilePath: string | null;
}

export interface TmdbRecord {
  tmdbId: number;
  tmdbType: "movie" | "tv";
  imdbId: string | null;
  matchedTitle: string;
  originalTitle: string | null;
  releaseDate: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  trailerKey: string | null;
  tagline: string | null;
  certification: string | null;
  tmdbRating: number | null;
  tmdbVotes: number;
  genres: string[];
  productionCompanies: string[];
  director: string | null;
  writers: string[];
  cast: CastMember[];
}

const IMG = "https://image.tmdb.org/t/p";

/** TMDB image CDN URLs. `path` is the raw `/xxxx.jpg` value from the record. */
export const tmdbImage = (
  path: string | null | undefined,
  size: "w185" | "w342" | "w500" | "w780" | "w1280" | "original" = "w500",
) => (path ? `${IMG}/${size}${path}` : null);

/** Low-res placeholder used while the real poster loads. */
export const tmdbBlur = (path: string | null | undefined) => (path ? `${IMG}/w92${path}` : null);
