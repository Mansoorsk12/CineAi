import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send, Sparkles, Star } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Poster } from "@/components/Poster";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CATALOG, imdbUrl, type Title } from "@/data/catalog";
import { recommendWithAi } from "@/lib/ai.functions";
import { useLibrary } from "@/lib/library";
import { recommend, reasonFor } from "@/lib/recommend";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "CineAI Assistant — Ask for a Recommendation" },
      {
        name: "description",
        content:
          "Ask the CineAI Assistant in plain language for movie and series recommendations tailored to your taste.",
      },
      { property: "og:title", content: "CineAI Assistant" },
      { property: "og:description", content: "Natural-language movie and series recommendations." },
    ],
  }),
  component: () => (
    <AppShell>
      <AssistantPage />
    </AppShell>
  ),
});

interface Msg {
  role: "user" | "ai";
  text: string;
  picks?: { title: Title; reason: string }[];
}

const PROMPTS = [
  "Suggest a Telugu thriller for tonight",
  "Give me movies similar to Interstellar",
  "Find highly rated Telugu action movies",
  "Recommend 5 Korean thrillers",
  "What should I watch after RRR?",
];

function AssistantPage() {
  const lib = useLibrary();
  const ask = useServerFn(recommendWithAi);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", text: "Hi! Tell me the mood, language or a film you loved — I'll do the rest." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const data = lib.snapshot;


  const send = async (prompt: string) => {
    if (!prompt.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", text: prompt }]);
    setInput("");
    setLoading(true);

    const fallback = () => {
      const picks = recommend(data, 5).map((t) => ({ title: t, reason: reasonFor(t, data) }));
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text: "AI is unavailable right now, so here are picks from your on-device recommendation engine:",
          picks,
        },
      ]);
    };

    try {
      const profile = `Favourite genres: ${lib.preferences.genres.join(", ") || "unset"}. Languages: ${
        lib.preferences.languages.join(", ") || "unset"
      }. Favourites: ${lib.favorites.slice(0, 5).join(", ") || "none"}.`;
      const res = await ask({ data: { prompt, profile } });
      if ("error" in res) {
        fallback();
      } else {
        setMessages((m) => [
          ...m,
          {
            role: "ai",
            text: res.message,
            picks: res.picks
              .map((p) => {
                const t = CATALOG.find((c) => c.id === p.id);
                return t ? { title: t, reason: p.reason } : null;
              })
              .filter((x): x is { title: Title; reason: string } => Boolean(x)),
          },
        ]);
      }
    } catch {
      fallback();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <h1 className="flex items-center gap-2 font-display text-4xl">
          <Sparkles className="size-6 text-primary" aria-hidden /> CineAI Assistant
        </h1>
        <p className="text-sm text-muted-foreground">
          Natural-language recommendations, grounded in the CineAI catalog.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {PROMPTS.map((p) => (
          <button key={p} onClick={() => send(p)}>
            <Badge variant="outline">{p}</Badge>
          </button>
        ))}
      </div>

      <div className="space-y-5">
        {messages.map((m, i) => (
          <div key={i} className="animate-cine-rise space-y-3">
            <div
              className={
                m.role === "user"
                  ? "ml-auto w-fit max-w-[85%] rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                  : "w-fit max-w-[85%] rounded-2xl bg-secondary px-4 py-2.5 text-sm"
              }
            >
              {m.text}
            </div>
            {m.picks && m.picks.length > 0 && (
              <ul className="grid gap-3 sm:grid-cols-2">
                {m.picks.map(({ title, reason }) => {
                  const imdb = imdbUrl(title);
                  return (
                    <li
                      key={title.id}
                      className="flex gap-3 rounded-2xl border bg-card p-3 shadow-[var(--shadow-card)]"
                    >
                      <Poster title={title} className="h-32 w-[86px] shrink-0 rounded-xl" />
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-sm font-semibold">{title.title}</p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="size-3 fill-gold text-gold" aria-hidden />
                          {title.rating.toFixed(1)} · {title.year} · {title.language}
                        </p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">{reason}</p>
                        <div className="flex flex-wrap gap-1 pt-1">
                          <Button asChild size="sm" variant="secondary" className="h-7 text-xs">
                            <Link to="/title/$id" params={{ id: title.id }}>
                              View details
                            </Link>
                          </Button>
                          {imdb && (
                            <Button
                              asChild
                              size="sm"
                              className="h-7 bg-gold text-cinema text-xs hover:bg-gold/90"
                            >
                              <a href={imdb} target="_blank" rel="noreferrer noopener">
                                IMDb
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
        {loading && <Skeleton className="h-16 w-2/3 rounded-2xl" />}
      </div>

      <form
        className="sticky bottom-20 flex gap-2 rounded-2xl border bg-card p-2 shadow-[var(--shadow-card)] md:bottom-4"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for something to watch…"
          aria-label="Ask CineAI"
          className="border-0 shadow-none focus-visible:ring-0"
        />
        <Button type="submit" size="icon" disabled={loading} aria-label="Send">
          <Send className="size-4" aria-hidden />
        </Button>
      </form>
    </div>
  );
}
