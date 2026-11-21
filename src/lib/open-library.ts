/** Open Library public search (free, keyless) — pure parsing lives here so it can be tested. */
import type { GoogleBookResult } from "./google-books";

export const OPEN_LIBRARY_MAX_RESULTS = 5;

interface RawDoc {
  key?: string;
  title?: string;
  subtitle?: string;
  author_name?: string[];
  cover_i?: number;
  first_sentence?: string[] | string;
}

export function openLibraryCoverUrl(coverId: number | undefined | null): string | null {
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null;
}

export function buildOpenLibraryUrl(query: string) {
  const params = new URLSearchParams({
    q: query.trim(),
    limit: String(OPEN_LIBRARY_MAX_RESULTS),
    fields: "key,title,subtitle,author_name,cover_i,first_sentence",
  });
  return `https://openlibrary.org/search.json?${params.toString()}`;
}

export function parseOpenLibraryResponse(json: unknown): GoogleBookResult[] {
  const docs = (json as { docs?: RawDoc[] } | null)?.docs;
  if (!Array.isArray(docs)) return [];
  const out: GoogleBookResult[] = [];
  for (const doc of docs) {
    const title = doc.title?.trim();
    if (!title) continue;
    const author = doc.author_name?.[0]?.trim();
    const sentence = Array.isArray(doc.first_sentence) ? doc.first_sentence[0] : doc.first_sentence;
    out.push({
      id: doc.key ?? `${title}-${out.length}`,
      titolo: doc.subtitle ? `${title}: ${doc.subtitle.trim()}` : title,
      autore: author || null,
      descrizione: sentence?.trim() || null,
      copertina_url: openLibraryCoverUrl(doc.cover_i),
    });
    if (out.length >= OPEN_LIBRARY_MAX_RESULTS) break;
  }
  return out;
}

export async function searchOpenLibrary(query: string, signal?: AbortSignal) {
  const res = await fetch(buildOpenLibraryUrl(query), { signal: signal ?? null });
  if (!res.ok) throw new Error(`Ricerca non riuscita (errore ${res.status}).`);
  return parseOpenLibraryResponse(await res.json());
}

/* ---------- Cover lookup by title + author ---------- */

export interface CoverCandidate {
  coverId: number;
  url: string;
  titolo: string;
  autore: string | null;
}

export class OpenLibraryRateLimitError extends Error {
  constructor() {
    super("Open Library ha ricevuto troppe richieste: riprova tra poco.");
    this.name = "OpenLibraryRateLimitError";
  }
}

export function buildOpenLibraryCoverSearchUrl(titolo: string, autore?: string | null) {
  const params = new URLSearchParams({ title: titolo.trim() });
  const a = autore?.trim();
  if (a) params.set("author", a);
  params.set("limit", String(OPEN_LIBRARY_MAX_RESULTS));
  params.set("fields", "key,title,author_name,cover_i");
  return `https://openlibrary.org/search.json?${params.toString()}`;
}

/** Only results that actually have a cover, without duplicates, in Open Library's order. */
export function parseCoverCandidates(json: unknown): CoverCandidate[] {
  const docs = (json as { docs?: RawDoc[] } | null)?.docs;
  if (!Array.isArray(docs)) return [];
  const seen = new Set<number>();
  const out: CoverCandidate[] = [];
  for (const doc of docs) {
    if (!doc.cover_i || seen.has(doc.cover_i)) continue;
    seen.add(doc.cover_i);
    out.push({
      coverId: doc.cover_i,
      url: openLibraryCoverUrl(doc.cover_i) as string,
      titolo: doc.title?.trim() ?? "",
      autore: doc.author_name?.[0]?.trim() || null,
    });
  }
  return out;
}

async function fetchCoverCandidates(url: string, signal?: AbortSignal) {
  const res = await fetch(url, { signal: signal ?? null });
  if (res.status === 429) throw new OpenLibraryRateLimitError();
  if (!res.ok) throw new Error(`Ricerca copertina non riuscita (errore ${res.status}).`);
  return parseCoverCandidates(await res.json());
}

/** Search by title + author; if nothing has a cover, retry with the title alone. */
export async function searchCovers(titolo: string, autore?: string | null, signal?: AbortSignal) {
  const withAuthor = await fetchCoverCandidates(buildOpenLibraryCoverSearchUrl(titolo, autore), signal);
  if (withAuthor.length > 0 || !autore?.trim()) return withAuthor;
  return fetchCoverCandidates(buildOpenLibraryCoverSearchUrl(titolo), signal);
}
