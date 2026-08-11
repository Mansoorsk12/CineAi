/**
 * Click-time media actions. Kept out of media.ts so components can import the
 * browser-only bits without pulling data helpers into unrelated modules.
 */
import type { Title } from "./catalog";
import { hasVerifiedTrailer, trailerSearchUrl, trailerUrl, personSearchUrl } from "./media";

export { certificationOf, personSearchUrl } from "./media";

const openTab = (url: string) => {
  if (typeof window === "undefined") return;
  window.open(url, "_blank", "noopener,noreferrer");
};

/**
 * Opens the exact official trailer for THIS title in a new tab, preserving the
 * current app state. If no trailer is verified for the title we fall back to a
 * YouTube search scoped to that same title — never another film's trailer.
 */
export const openTrailer = (t: Title) => {
  openTab(hasVerifiedTrailer(t) ? trailerUrl(t)! : trailerSearchUrl(t));
};

/** Opens a Google search for the exact person clicked. */
export const openPersonSearch = (name: string) => {
  openTab(personSearchUrl(name));
};
