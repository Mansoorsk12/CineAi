/** Client-safe shapes for the dynamic (database-backed) catalog. */

export interface MediaCastMember {
  name: string;
  character: string | null;
  profilePath: string | null;
}

export interface MediaItem {
  id: string;
  tmdb_id: number;
  media_type: "movie" | "tv";
  title: string;
  original_title: string | null;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  year: number | null;
  runtime: number | null;
  genres: string[];
  language: string;
  language_code: string;
  country: string | null;
  industry: string;
  rating: number;
  vote_count: number;
  popularity: number;
  imdb_id: string | null;
  trailer_key: string | null;
  director: string | null;
  cast_members: MediaCastMember[];
  seasons: number | null;
  episodes: number | null;
  status: string | null;
  featured: boolean;
  hidden: boolean;
  first_imported_at: string;
  updated_at: string;
}

export interface MediaFilters {
  language?: string;
  industry?: string;
  type?: "movie" | "tv";
  year?: number;
  genre?: string;
  status?: "released" | "upcoming";
  minRating?: number;
  sort?: "popularity" | "rating" | "newest";
  page?: number;
}

export const TMDB_IMAGE = (path: string | null | undefined, size = "w342") =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null;

export const LANGUAGE_OPTIONS = [
  "Telugu",
  "Tamil",
  "Kannada",
  "Malayalam",
  "Hindi",
  "Bengali",
  "Marathi",
  "Punjabi",
  "English",
  "Korean",
  "Japanese",
  "Spanish",
];

export const INDUSTRY_OPTIONS = [
  "Tollywood",
  "Kollywood",
  "Bollywood",
  "Sandalwood",
  "Mollywood",
  "Hollywood",
  "Indian Cinema",
  "International",
];

export const GENRE_OPTIONS = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "History",
  "Horror",
  "Music",
  "Mystery",
  "Romance",
  "Science Fiction",
  "Thriller",
  "War",
  "Western",
];
