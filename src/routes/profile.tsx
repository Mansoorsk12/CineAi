import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CATALOG, GENRES, LANGUAGES, type Title } from "@/data/catalog";
import { useAuth } from "@/lib/auth";
import { useLibrary } from "@/lib/library";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile & Viewing Analytics | CineAI" },
      {
        name: "description",
        content:
          "Your CineAI profile: preferences, monthly goals, genre and language analytics and viewing activity.",
      },
      { property: "og:title", content: "Profile & Analytics | CineAI" },
      { property: "og:description", content: "Preferences, goals and viewing analytics on CineAI." },
    ],
  }),
  component: () => (
    <AppShell>
      <ProfilePage />
    </AppShell>
  ),
});

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const lib = useLibrary();
  const [name, setName] = useState(user?.name ?? "");

  const watched = lib.watched
    .map((w) => CATALOG.find((t) => t.id === w.id))
    .filter((t): t is Title => Boolean(t));
  const favs = lib.favorites
    .map((id) => CATALOG.find((t) => t.id === id))
    .filter((t): t is Title => Boolean(t));

  const count = (list: string[]) => {
    const m = new Map<string, number>();
    list.forEach((v) => m.set(v, (m.get(v) ?? 0) + 1));
    return [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name2, value]) => ({ name: name2, value }));
  };

  const genreData = count(watched.flatMap((t) => t.genres));
  const langData = count(watched.map((t) => t.language));
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const activity = months.map((m2, i) => ({
    month: m2,
    watched: lib.watched.filter((w) => new Date(w.date).getMonth() === i).length,
  }));
  const avgRating = favs.length
    ? (favs.reduce((s, t) => s + t.rating, 0) / favs.length).toFixed(1)
    : "—";

  const toggleIn = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  return (
    <div className="space-y-10">
      <header className="grid gap-4 rounded-3xl border bg-card p-6 shadow-[var(--shadow-card)] sm:grid-cols-[auto_1fr]">
        <div className="grid size-20 place-items-center rounded-2xl bg-cinema font-display text-3xl text-cinema-foreground">
          {(user?.name ?? "C").slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="pf-name">Display name</Label>
              <Input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} className="w-56" />
            </div>
            <Button
              onClick={() => {
                updateProfile({ name });
                toast("Profile updated");
              }}
            >
              Save
            </Button>
          </div>
          <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Movies watched" value={watched.filter((t) => t.kind === "movie").length} />
        <Stat label="Series watched" value={watched.filter((t) => t.kind === "series").length} />
        <Stat label="Favourites" value={lib.favorites.length} />
        <Stat label="Watchlist" value={lib.watchlist.length} />
        <Stat label="Avg favourite rating" value={avgRating} />
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl">Your CineAI Analytics</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Top genres">
            {genreData.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={genreData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85}>
                    {genreData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty />
            )}
          </Panel>
          <Panel title="Languages">
            {langData.length ? (
              <div className="space-y-3 pt-2">
                {langData.map((l) => {
                  const pct = Math.round((l.value / watched.length) * 100);
                  return (
                    <div key={l.name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{l.name}</span>
                        <span className="text-muted-foreground">{pct}%</span>
                      </div>
                      <Progress value={pct} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty />
            )}
          </Panel>
          <Panel title="Monthly activity" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={activity}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="watched" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl">Preferences</h2>
        <Panel title="Favourite genres">
          <div className="flex flex-wrap gap-2 pt-2">
            {GENRES.map((g) => (
              <button
                key={g}
                onClick={() => {
                  lib.setPreferences({ genres: toggleIn(lib.preferences.genres, g) });
                  toast("Preferences updated");
                }}
              >
                <Badge variant={lib.preferences.genres.includes(g) ? "default" : "outline"}>{g}</Badge>
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="Preferred languages">
          <div className="flex flex-wrap gap-2 pt-2">
            {LANGUAGES.map((l) => (
              <button
                key={l}
                onClick={() => {
                  lib.setPreferences({ languages: toggleIn(lib.preferences.languages, l) });
                  toast("Preferences updated");
                }}
              >
                <Badge variant={lib.preferences.languages.includes(l) ? "default" : "outline"}>{l}</Badge>
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="Monthly goals">
          <div className="grid gap-3 pt-2 sm:grid-cols-3">
            {(
              [
                ["movies", "Movies / month"],
                ["series", "Series / month"],
                ["hours", "Hours / month"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={`goal-${key}`}>{label}</Label>
                <Input
                  id={`goal-${key}`}
                  type="number"
                  min={0}
                  value={lib.targets[key]}
                  onChange={(e) => lib.setTargets({ [key]: Number(e.target.value) })}
                />
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}

function Panel({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]", className)}>
      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="py-10 text-center text-sm text-muted-foreground">Mark titles as watched to see analytics.</p>;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)]">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="font-display text-3xl">{value}</p>
    </div>
  );
}
