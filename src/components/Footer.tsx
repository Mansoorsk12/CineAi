import { Link } from "@tanstack/react-router";
import { Github, Instagram, Twitter, Youtube } from "lucide-react";
import { Logo } from "./Logo";

const COLS = [
  {
    heading: "Discover",
    links: [
      { label: "Movies", to: "/movies" },
      { label: "Series", to: "/series" },
      { label: "Genres", to: "/genres" },
      { label: "Search", to: "/search" },
    ],
  },
  {
    heading: "Your library",
    links: [
      { label: "Watchlist", to: "/watchlist" },
      { label: "Favourites", to: "/favourites" },
      { label: "Watched", to: "/watched" },
      { label: "Profile", to: "/profile" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="mt-20 border-t bg-secondary/40">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            AI-powered movie &amp; series discovery. Built around what you actually love watching.
          </p>
          <div className="flex gap-2 pt-1 text-muted-foreground">
            <Twitter className="size-4" aria-hidden />
            <Instagram className="size-4" aria-hidden />
            <Youtube className="size-4" aria-hidden />
            <Github className="size-4" aria-hidden />
          </div>
        </div>
        {COLS.map((col) => (
          <div key={col.heading} className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {col.heading}
            </h3>
            <ul className="space-y-2 text-sm">
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-muted-foreground hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Company
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>About</li>
            <li>Privacy</li>
            <li>Terms</li>
            <li>Contact</li>
          </ul>
        </div>
      </div>
      <div className="border-t px-4 py-5 text-center text-xs text-muted-foreground sm:px-6">
        © {new Date().getFullYear()} CineAI · Demo project. Accounts are stored locally in your
        browser and are not production-secure.
      </div>
    </footer>
  );
}
