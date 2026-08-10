/**
 * Server-only AI helper. The Lovable AI key never leaves the server.
 */
import { CATALOG } from "@/data/catalog";

export interface AiPick {
  id: string;
  reason: string;
}

export interface AiReply {
  message: string;
  picks: AiPick[];
  source: "ai" | "fallback";
}

const catalogLine = (t: (typeof CATALOG)[number]) =>
  `${t.id} | ${t.title} (${t.year}) | ${t.kind} | ${t.language} | ${t.genres.join("/")} | ${t.rating}`;

export async function askAssistant(
  prompt: string,
  profile: string,
): Promise<AiReply | null> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return null;

  const system = [
    "You are CineAI Assistant, a warm, concise movie & series curator.",
    "You may ONLY recommend titles from the catalog below, referenced by their exact id.",
    "Return strict JSON: {\"message\": string, \"picks\": [{\"id\": string, \"reason\": string}]}.",
    "Give 3-6 picks. Each reason is one short sentence tied to the user's request.",
    "CATALOG (id | title (year) | kind | language | genres | rating):",
    CATALOG.map(catalogLine).join("\n"),
  ].join("\n");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "google/gemini-3.6-flash",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: `User profile: ${profile}\n\nRequest: ${prompt}` },
      ],
    }),
  });

  if (!res.ok) {
    if (res.status === 429) throw new Error("RATE_LIMIT");
    if (res.status === 402) throw new Error("NO_CREDITS");
    return null;
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) return null;

  try {
    const parsed = JSON.parse(content) as { message?: string; picks?: AiPick[] };
    const picks = (parsed.picks ?? [])
      .filter((p) => p && typeof p.id === "string" && CATALOG.some((t) => t.id === p.id))
      .slice(0, 6)
      .map((p) => ({ id: p.id, reason: String(p.reason ?? "") }));
    if (!picks.length) return null;
    return { message: parsed.message ?? "Here's what I'd watch:", picks, source: "ai" };
  } catch {
    return null;
  }
}
