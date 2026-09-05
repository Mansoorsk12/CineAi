import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, Clapperboard, Clock, Film, Loader2, Send, XCircle } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listMyRequests, submitMediaRequest, type MediaRequestRow } from "@/lib/requests.functions";
import { TMDB_IMAGE } from "@/lib/media-types";

export const Route = createFileRoute("/requests")({
  head: () => ({
    meta: [
      { title: "Request a Movie or Series — CineAI" },
      {
        name: "description",
        content: "Request a movie or series to be added to CineAI. We verify every request against TMDB and track its status here.",
      },
      { property: "og:title", content: "Request a Movie or Series — CineAI" },
      {
        property: "og:description",
        content: "Submit a verified movie or series request and track its approval status.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell>
      <RequestsPage />
    </AppShell>
  ),
});

const STATUS_STYLE: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  pending: { label: "Pending", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400", icon: Clock },
  reviewing: { label: "Reviewing", className: "bg-sky-500/15 text-sky-600 dark:text-sky-400", icon: Clock },
  approved: { label: "Approved", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", icon: CheckCircle2 },
  rejected: { label: "Rejected", className: "bg-rose-500/15 text-rose-600 dark:text-rose-400", icon: XCircle },
};

function RequestsPage() {
  const submit = useServerFn(submitMediaRequest);
  const list = useServerFn(listMyRequests);
  const queryClient = useQueryClient();

  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");
  const [title, setTitle] = useState("");
  const [tmdbRef, setTmdbRef] = useState("");
  const [imdbRef, setImdbRef] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["my-requests"],
    queryFn: () => list(),
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (title.trim().length < 2) {
      setError("Please enter the movie or series name.");
      return;
    }
    setBusy(true);
    try {
      const res = await submit({ data: { title, mediaType, tmdbRef, imdbRef, message } });
      if (!res.ok) {
        setError(res.error ?? "Could not submit your request.");
        return;
      }
      toast.success(`Request submitted${res.request?.verified_title ? `: ${res.request.verified_title}` : ""}`);
      setTitle("");
      setTmdbRef("");
      setImdbRef("");
      setMessage("");
      await queryClient.invalidateQueries({ queryKey: ["my-requests"] });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <header>
        <h1 className="font-display text-4xl">Request a Movie or Series</h1>
        <p className="text-sm text-muted-foreground">
          Missing something? Tell us — we verify every request against TMDB before adding it.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-3xl border bg-card p-5 sm:p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="req-type">Type</Label>
            <Select value={mediaType} onValueChange={(v) => setMediaType(v as "movie" | "tv")}>
              <SelectTrigger id="req-type" className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="movie">
                  <span className="flex items-center gap-2"><Film className="size-4" aria-hidden /> Movie</span>
                </SelectItem>
                <SelectItem value="tv">
                  <span className="flex items-center gap-2"><Clapperboard className="size-4" aria-hidden /> Series</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="req-title">Title *</Label>
            <Input
              id="req-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Pushpa 2: The Rule"
              maxLength={200}
              className="rounded-xl"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="req-tmdb">TMDB ID or URL (optional)</Label>
            <Input
              id="req-tmdb"
              value={tmdbRef}
              onChange={(e) => setTmdbRef(e.target.value)}
              placeholder="e.g. 934632 or themoviedb.org/movie/934632"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="req-imdb">IMDb ID or URL (optional)</Label>
            <Input
              id="req-imdb"
              value={imdbRef}
              onChange={(e) => setImdbRef(e.target.value)}
              placeholder="e.g. tt12345678"
              className="rounded-xl"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="req-msg">Message (optional)</Label>
          <Textarea
            id="req-msg"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Anything we should know?"
            maxLength={1000}
            rows={3}
            className="rounded-xl"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" disabled={busy} className="gap-2 rounded-full bg-cinema text-cinema-foreground hover:bg-cinema/90">
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
          {busy ? "Verifying…" : "Submit request"}
        </Button>
      </form>

      <section className="space-y-3">
        <h2 className="font-display text-2xl">My Requests</h2>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : !requests?.length ? (
          <p className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
            You haven't requested anything yet. Missing a title? Submit the form above, or{" "}
            <Link to="/discover" className="text-primary underline-offset-2 hover:underline">
              browse the catalogue
            </Link>
            .
          </p>
        ) : (
          <ul className="space-y-3">
            {requests.map((r) => (
              <RequestRow key={r.id} request={r} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function RequestRow({ request: r }: { request: MediaRequestRow }) {
  const style = STATUS_STYLE[r.status] ?? STATUS_STYLE.pending!;
  const Icon = style.icon;
  const poster = TMDB_IMAGE(r.verified_poster_path, "w185");
  return (
    <li className="flex items-start gap-4 rounded-2xl border bg-card p-4">
      {poster ? (
        <img
          src={poster}
          alt={`Poster for ${r.verified_title ?? r.query_title}`}
          className="h-20 w-14 shrink-0 rounded-lg object-cover"
          loading="lazy"
        />
      ) : (
        <div className="grid h-20 w-14 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
          {r.media_type === "tv" ? <Clapperboard className="size-5" aria-hidden /> : <Film className="size-5" aria-hidden />}
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">
            {r.verified_title ?? r.query_title}
          </span>
          <Badge variant="secondary" className="capitalize">
            {r.media_type === "tv" ? "Series" : "Movie"}
          </Badge>
          <Badge className={`gap-1 border-0 ${style.className}`}>
            <Icon className="size-3" aria-hidden /> {style.label}
          </Badge>
        </div>
        {r.verified_title && r.verified_title !== r.query_title && (
          <p className="text-xs text-muted-foreground">Requested as “{r.query_title}”</p>
        )}
        <p className="text-xs text-muted-foreground">
          Submitted {new Date(r.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
        </p>
        {r.admin_note && (
          <p className="rounded-lg bg-secondary px-2.5 py-1.5 text-xs text-secondary-foreground">
            Admin note: {r.admin_note}
          </p>
        )}
      </div>
    </li>
  );
}
