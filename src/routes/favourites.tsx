import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Heart } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TitleGrid } from "@/components/TitleCard";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CATALOG, type Title } from "@/data/catalog";
import { useLibrary } from "@/lib/library";

export const Route = createFileRoute("/favourites")({
  head: () => ({
    meta: [
      { title: "Your Favourites | CineAI" },
      {
        name: "description",
        content: "Your favourite movies and series collection on CineAI, searchable and sortable.",
      },
      { property: "og:title", content: "Your Favourites | CineAI" },
      { property: "og:description", content: "The movies and series you love most, in one place." },
    ],
  }),
  component: () => (
    <AppShell>
      <FavouritesPage />
    </AppShell>
  ),
});

function FavouritesPage() {
  const lib = useLibrary();
  const [tab, setTab] = useState("movie");
  const [q, setQ] = useState("");

  const items = lib.favorites
    .map((id) => CATALOG.find((t) => t.id === id))
    .filter((t): t is Title => Boolean(t))
    .filter((t) => t.kind === tab)
    .filter((t) => t.title.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl">Favourites</h1>
          <p className="text-sm text-muted-foreground">{lib.favorites.length} saved</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="movie">Movies</TabsTrigger>
              <TabsTrigger value="series">Series</TabsTrigger>
            </TabsList>
          </Tabs>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search favourites"
            aria-label="Search favourites"
            className="w-48"
          />
        </div>
      </header>

      {items.length ? (
        <TitleGrid items={items} />
      ) : (
        <EmptyState
          icon={<Heart className="size-6" aria-hidden />}
          title="Start building your favourite collection."
          description="Tap the heart on any title to keep it here."
        />
      )}
    </div>
  );
}
