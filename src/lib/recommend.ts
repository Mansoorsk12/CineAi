import { CATALOG, type Title } from "@/data/catalog";
import type { UserData } from "./storage";

/**
 * Local recommendation engine. Also used as the fallback whenever the AI
 * gateway is unavailable, so the app never breaks on an AI failure.
 *
 * score = genre match + language match + rating + year preference
 *       + similarity to favourites + watch history signal
 */
export function scoreTitle(t: Title, data: UserData, seed?: Title[]): number {
  const { preferences } = data;
  let score = t.rating * 2 + t.popularity / 20;

  const likedGenres = new Set<string>([...preferences.genres]);
  const likedLangs = new Set<string>([...preferences.languages]);
  seed?.forEach((s) => {
    s.genres.forEach((g) => likedGenres.add(g));
    likedLangs.add(s.language);
  });

  score += t.genres.filter((g) => likedGenres.has(g)).length * 6;
  if (likedLangs.has(t.language)) score += 7;
  if (t.year >= preferences.yearFrom && t.year <= preferences.yearTo) score += 3;
  if (data.watched.some((w) => w.id === t.id)) score -= 25;
  if (data.watchlist.includes(t.id)) score -= 8;
  if (data.favorites.includes(t.id)) score -= 100;
  return score;
}

export function recommend(data: UserData, limit = 12, kind?: Title["kind"]): Title[] {
  const seed = [...data.favorites, ...data.recentlyViewed.slice(0, 5)]
    .map((id) => CATALOG.find((t) => t.id === id))
    .filter((t): t is Title => Boolean(t));

  return CATALOG.filter((t) => !kind || t.kind === kind)
    .map((t) => ({ t, s: scoreTitle(t, data, seed) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.t);
}

export function similarTo(title: Title, limit = 8): Title[] {
  return CATALOG.filter((t) => t.id !== title.id)
    .map((t) => {
      let s = t.genres.filter((g) => title.genres.includes(g)).length * 10;
      if (t.language === title.language) s += 6;
      s -= Math.abs(t.year - title.year) / 8;
      s -= Math.abs(t.rating - title.rating) * 2;
      if (t.kind === title.kind) s += 3;
      return { t, s };
    })
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.t);
}

export function reasonFor(t: Title, data: UserData): string {
  const g = t.genres.find((x) => data.preferences.genres.includes(x));
  if (g && data.preferences.languages.includes(t.language))
    return `You watch a lot of ${t.language} ${g.toLowerCase()} titles.`;
  if (g) return `Matches your favourite genre: ${g}.`;
  if (data.preferences.languages.includes(t.language))
    return `Picked from your preferred language: ${t.language}.`;
  if (t.rating >= 8.3) return "Critically acclaimed and highly rated.";
  return "Popular with viewers who like what you like.";
}
