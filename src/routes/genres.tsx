import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { TitleGrid } from "@/components/TitleCard";
import { Button } from "@/components/ui/button";
import { CATALOG, GENRES, LANGUAGES } from "@/data/catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/genres")({
  head: () => ({
    meta: [
      { title: "Genres & Languages — Explore | CineAI" },
      {
        name: "description",
        content:
          "Explore CineAI by genre and language: action, thriller, romance, sci-fi and Telugu, Hindi, Tamil, Korean and more.",
      },
      { property: "og:title", content: "Genres & Languages | CineAI" },
      { property: "og:description", content: "Explore titles by genre and language on CineAI." },
    ],
  }),
  component: () => (
    <AppShell>
      <GenresPage />
    </AppShell>
  ),
});

function GenresPage() {
  const [genre, setGenre] = useState<string | null>(null);
  const [lang, setLang] = useState<string | null>(null);

  const results = CATALOG.filter(
    (t) => (!genre || t.genres.includes(genre)) && (!lang || t.language === lang),
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-4xl">Genres</h1>
        <p className="text-sm text-muted-foreground">Pick a mood, or explore by language.</p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {GENRES.map((g) => (
          <button
            key={g}
            onClick={() => setGenre(genre === g ? null : g)}
            className={cn(
              "relative overflow-hidden rounded-2xl border p-5 text-left transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]",
              genre === g ? "cinema-panel" : "bg-card",
            )}
          >
            <span className="font-display text-xl">{g}</span>
            <span className="block text-xs text-muted-foreground">
              {CATALOG.filter((t) => t.genres.includes(g)).length} titles
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {LANGUAGES.map((l) => (
          <Button
            key={l}
            size="sm"
            variant={lang === l ? "default" : "outline"}
            onClick={() => setLang(lang === l ? null : l)}
          >
            {l}
          </Button>
        ))}
      </div>

      <TitleGrid items={results} />
    </div>
  );
}
