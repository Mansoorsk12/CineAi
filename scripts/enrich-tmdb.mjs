/**
 * One-off build-time enrichment.
 *
 * Reads the CineAI catalog, resolves every title to a single verified TMDB
 * record (search by title+year, or a pinned tmdbId override), and writes
 * src/data/tmdb.generated.ts with poster / backdrop / trailer / cast /
 * crew / imdbId pulled from THAT record only. Because everything for a title
 * comes from one TMDB id, cross-linking between films is impossible.
 *
 * Run: TMDB_API_KEY=... node scripts/enrich-tmdb.mjs
 */
import fs from "node:fs";
import path from "node:path";

const KEY = process.env.TMDB_API_KEY;
if (!KEY) throw new Error("TMDB_API_KEY missing");
const V4 = KEY.startsWith("ey");
const BASE = "https://api.themoviedb.org/3";

const api = async (p, params = {}) => {
  const u = new URL(BASE + p);
  for (const [k, v] of Object.entries(params)) if (v != null) u.searchParams.set(k, String(v));
  if (!V4) u.searchParams.set("api_key", KEY);
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(u, {
      headers: V4 ? { Authorization: `Bearer ${KEY}`, accept: "application/json" } : { accept: "application/json" },
    });
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 1500));
      continue;
    }
    if (!res.ok) return null;
    return res.json();
  }
  return null;
};

// Pinned TMDB ids for titles where plain search is ambiguous.
const OVERRIDES = JSON.parse(fs.readFileSync(new URL("./tmdb-overrides.json", import.meta.url), "utf8"));

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

function scoreCandidate(c, item) {
  const name = c.title || c.name || "";
  const orig = c.original_title || c.original_name || "";
  const date = c.release_date || c.first_air_date || "";
  const y = date ? Number(date.slice(0, 4)) : 0;
  let s = 0;
  const n = norm(item.title);
  if (norm(name) === n || norm(orig) === n) s += 60;
  else if (norm(name).includes(n) || n.includes(norm(name))) s += 30;
  if (y === item.year) s += 40;
  else if (Math.abs(y - item.year) === 1) s += 20;
  else if (y) s -= 25;
  if (item.language && c.original_language === LANG[item.language]) s += 15;
  s += Math.min(10, (c.popularity || 0) / 10);
  return s;
}

const LANG = {
  Telugu: "te",
  Tamil: "ta",
  Hindi: "hi",
  Malayalam: "ml",
  Kannada: "kn",
  English: "en",
  Korean: "ko",
  Japanese: "ja",
  Spanish: "es",
  French: "fr",
};

function pickTrailer(videos) {
  const vids = (videos?.results || []).filter((v) => v.site === "YouTube");
  const rank = (v) => {
    let s = 0;
    if (v.type === "Trailer") s += 40;
    else if (v.type === "Teaser") s += 20;
    if (v.official) s += 20;
    if (/official/i.test(v.name)) s += 10;
    if (/theatrical|main/i.test(v.name)) s += 5;
    if (v.size >= 1080) s += 3;
    return s;
  };
  const best = vids.sort((a, b) => rank(b) - rank(a))[0];
  return best && rank(best) >= 20 ? best.key : null;
}

function certification(details, kind) {
  if (kind === "movie") {
    const rel = details.release_dates?.results || [];
    for (const cc of ["IN", "US", "GB"]) {
      const hit = rel.find((r) => r.iso_3166_1 === cc);
      const cert = hit?.release_dates?.map((d) => d.certification).find((c) => c);
      if (cert) return cert;
    }
  } else {
    const rel = details.content_ratings?.results || [];
    for (const cc of ["IN", "US", "GB"]) {
      const hit = rel.find((r) => r.iso_3166_1 === cc);
      if (hit?.rating) return hit.rating;
    }
  }
  return null;
}

async function resolve(item) {
  const kind = item.kind;
  const type = kind === "series" ? "tv" : "movie";
  const pinned = OVERRIDES[item.key];
  let id = pinned?.tmdbId ?? null;
  let candidateNote = pinned ? "pinned" : "";

  if (!id) {
    const queries = [item.title, item.title.split(/[:–-]/)[0].trim()];
    let best = null;
    for (const q of queries) {
      const r = await api(`/search/${type}`, { query: q, include_adult: false });
      for (const c of r?.results || []) {
        const sc = scoreCandidate(c, item);
        if (!best || sc > best.sc) best = { sc, c };
      }
      if (best && best.sc >= 90) break;
    }
    if (!best || best.sc < 55) return { item, error: "NO_MATCH", best };
    id = best.c.id;
    candidateNote = `score ${best.sc}`;
  }

  const d = await api(`/${type}/${id}`, {
    append_to_response:
      type === "movie" ? "credits,videos,external_ids,release_dates" : "credits,videos,external_ids,content_ratings",
  });
  if (!d) return { item, error: "NO_DETAILS" };

  let trailer = pickTrailer(d.videos);
  if (!trailer) {
    // Retry without language filter (regional films often only have te/hi videos).
    const alt = await api(`/${type}/${id}/videos`, { language: null, include_video_language: "en,null,te,hi,ta" });
    trailer = pickTrailer(alt);
  }

  const crew = d.credits?.crew || [];
  const director =
    crew.filter((c) => c.job === "Director").map((c) => c.name).join(", ") ||
    (d.created_by || []).map((c) => c.name).join(", ") ||
    null;
  const writers = [
    ...new Set(crew.filter((c) => ["Writer", "Screenplay", "Story", "Author"].includes(c.job)).map((c) => c.name)),
  ].slice(0, 4);

  const cast = (d.credits?.cast || []).slice(0, 12).map((c) => ({
    name: c.name,
    character: c.character || null,
    profilePath: c.profile_path || null,
  }));

  return {
    item,
    note: candidateNote,
    data: {
      tmdbId: id,
      tmdbType: type,
      imdbId: d.imdb_id || d.external_ids?.imdb_id || null,
      matchedTitle: d.title || d.name,
      originalTitle: d.original_title || d.original_name || null,
      releaseDate: d.release_date || d.first_air_date || null,
      posterPath: d.poster_path || null,
      backdropPath: d.backdrop_path || null,
      trailerKey: trailer,
      tagline: d.tagline || null,
      certification: certification(d, kind),
      tmdbRating: d.vote_average ? Math.round(d.vote_average * 10) / 10 : null,
      tmdbVotes: d.vote_count || 0,
      genres: (d.genres || []).map((g) => g.name),
      productionCompanies: (d.production_companies || []).map((c) => c.name).slice(0, 4),
      director,
      writers,
      cast,
    },
  };
}

// ---- read catalog ----
const src = fs.readFileSync(path.resolve("src/data/catalog.ts"), "utf8");
const blocks = src.split(/\n  ([ms])\(\{/).slice(1);
const items = [];
for (let i = 0; i < blocks.length; i += 2) {
  const kind = blocks[i] === "s" ? "series" : "movie";
  const b = blocks[i + 1];
  items.push({
    kind,
    key: /id:\s*"([^"]+)"/.exec(b)?.[1],
    title: /title:\s*"([^"]+)"/.exec(b)?.[1],
    year: Number(/year:\s*(\d+)/.exec(b)?.[1]),
    language: /language:\s*"([^"]+)"/.exec(b)?.[1],
  });
}

const out = {};
const report = [];
for (const item of items) {
  const r = await resolve(item);
  if (r.error) {
    report.push(`FAIL  ${item.key} (${item.title} ${item.year}) -> ${r.error}`);
    continue;
  }
  out[item.key] = r.data;
  const y = r.data.releaseDate?.slice(0, 4);
  const flag =
    norm(r.data.matchedTitle) === norm(item.title) && Math.abs(Number(y) - item.year) <= 1 ? "ok  " : "CHECK";
  report.push(
    `${flag} ${item.key} :: ${item.title} ${item.year} -> ${r.data.matchedTitle} ${y} [tmdb ${r.data.tmdbId}] ${
      r.data.posterPath ? "P" : "-"
    }${r.data.trailerKey ? "T" : "-"}${r.data.cast.length ? "C" : "-"} ${r.note}`,
  );
}

fs.writeFileSync(
  "src/data/tmdb.generated.ts",
  `/**
 * AUTO-GENERATED by scripts/enrich-tmdb.mjs — do not edit by hand.
 * Every field for a title comes from a single verified TMDB record, so a
 * poster/trailer/cast can never belong to a different film.
 */
import type { TmdbRecord } from "./tmdb-types";

export const TMDB: Record<string, TmdbRecord> = ${JSON.stringify(out, null, 2)};
`,
);
fs.writeFileSync("/tmp/tmdb-report.txt", report.join("\n"));
console.log(report.join("\n"));
console.log(`\nresolved ${Object.keys(out).length}/${items.length}`);
