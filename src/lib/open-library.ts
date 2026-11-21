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
