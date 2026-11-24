/** Apple Books (iTunes Search API, free and keyless; strong on Italian ebooks). Pure parsing is tested. */

export interface AppleBookResult {
  id: string;
  titolo: string;
  autore: string | null;
  descrizione: string | null;
  copertina_url: string | null;
}

export class AppleBooksRateLimitError extends Error {
  constructor() {
    super("Apple Books ha ricevuto troppe richieste: riprova tra poco.");
    this.name = "AppleBooksRateLimitError";
  }
}

export function buildAppleBooksUrl(titolo: string, autore?: string | null) {
  const term = [titolo.trim(), autore?.trim()].filter(Boolean).join(" ");
  const params = new URLSearchParams({ term, entity: "ebook", country: "IT", limit: "5" });
  return `https://itunes.apple.com/search?${params.toString()}`;
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  rsquo: "’",
  lsquo: "‘",
  ldquo: "“",
  rdquo: "”",
  hellip: "…",
  ndash: "–",
  mdash: "—",
  laquo: "«",
  raquo: "»",
};

/** Removes HTML tags (keeping paragraph breaks) and decodes common entities. */
export function stripHtml(html: string): string {
  return html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*(p|div|li|h\d)\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(Number.parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name: string) => ENTITIES[name.toLowerCase()] ?? m)
    .replace(/[ \t\u00a0]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** artworkUrl100 → 600x600 version. */
export function appleCoverUrl(artworkUrl100: string | undefined | null): string | null {
  if (!artworkUrl100) return null;
  return artworkUrl100.replace("100x100bb", "600x600bb");
}

interface RawAppleItem {
  trackId?: number | string;
  trackName?: string;
  artistName?: string;
  description?: string;
  artworkUrl100?: string;
}

export function parseAppleBooksResponse(json: unknown): AppleBookResult[] {
  const results = (json as { results?: RawAppleItem[] } | null)?.results;
  if (!Array.isArray(results)) return [];
  const out: AppleBookResult[] = [];
  for (const r of results) {
    const titolo = r.trackName?.trim();
    if (!titolo) continue;
    const descrizione = r.description ? stripHtml(r.description) : "";
    out.push({
      id: String(r.trackId ?? `${titolo}-${out.length}`),
      titolo,
      autore: r.artistName?.trim() || null,
      descrizione: descrizione || null,
      copertina_url: appleCoverUrl(r.artworkUrl100),
    });
  }
  return out;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Words that mark study guides / summaries instead of the book itself. */
const NOT_THE_BOOK = /\b(analisi|riassunto|sintesi|guida alla lettura|summary|study guide)\b/;

/**
 * How well a result matches the requested book (0 = not the book): the title must
 * match (equal, or one contains the other), the author helps, summaries are skipped.
 */
export function matchScore(result: { titolo: string; autore: string | null }, titolo: string, autore?: string | null) {
  const wanted = norm(titolo);
  const t = norm(result.titolo);
  if (!wanted || !t) return 0;
  if (NOT_THE_BOOK.test(t) && !NOT_THE_BOOK.test(wanted)) return 0;
  let score: number;
  if (t === wanted) score = 4;
  else if (t.startsWith(wanted) || wanted.startsWith(t)) score = 3;
  else if (t.includes(wanted) || wanted.includes(t)) score = 2;
  else return 0;
  const wantedAuthor = autore ? norm(autore).split(" ").filter((w) => w.length > 2) : [];
  const a = result.autore ? norm(result.autore) : "";
  if (wantedAuthor.length && wantedAuthor.some((w) => a.includes(w))) score += 2;
  return score;
}

/** Matching results, best first (stable for equal scores). */
export function rankMatches<T extends { titolo: string; autore: string | null }>(
  results: T[],
  titolo: string,
  autore?: string | null,
): T[] {
  return results
    .map((r, i) => ({ r, i, s: matchScore(r, titolo, autore) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.r);
}

export function pickBestMatch<T extends { titolo: string; autore: string | null }>(
  results: T[],
  titolo: string,
  autore?: string | null,
): T | null {
  return rankMatches(results, titolo, autore)[0] ?? null;
}

/** Google Images search for a manual copy-paste of the cover address. */
export function googleImagesCoverUrl(titolo: string, autore?: string | null) {
  const q = [titolo.trim(), autore?.trim(), "copertina libro"].filter(Boolean).join(" ");
  return `https://www.google.com/search?${new URLSearchParams({ tbm: "isch", q }).toString()}`;
}

export async function searchAppleBooks(titolo: string, autore?: string | null, signal?: AbortSignal) {
  const res = await fetch(buildAppleBooksUrl(titolo, autore), { signal: signal ?? null });
  if (res.status === 429 || res.status === 403) throw new AppleBooksRateLimitError();
  if (!res.ok) throw new Error(`Apple Books non risponde (errore ${res.status}).`);
  return parseAppleBooksResponse(await res.json());
}
