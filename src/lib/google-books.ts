/** Google Books public search — pure parsing lives here so it can be tested. */

export interface GoogleBookResult {
  id: string;
  titolo: string;
  autore: string | null;
  descrizione: string | null;
  copertina_url: string | null;
}

export const GOOGLE_BOOKS_MAX_RESULTS = 5;

interface RawVolume {
  id?: string;
  volumeInfo?: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    description?: string;
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  };
}

function stripHtml(s: string) {
  return s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Google returns http:// thumbnails with a page-curl effect; use https and a clean image. */
export function normalizeCoverUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  return url.replace(/^http:\/\//, "https://").replace(/&edge=curl/g, "");
}

export function parseGoogleBooksResponse(json: unknown): GoogleBookResult[] {
  const items = (json as { items?: RawVolume[] } | null)?.items;
  if (!Array.isArray(items)) return [];
  const out: GoogleBookResult[] = [];
  for (const item of items) {
    const info = item.volumeInfo;
    const title = info?.title?.trim();
    if (!info || !title) continue;
    const authors = (info.authors ?? []).map((a) => a.trim()).filter(Boolean);
    const description = info.description ? stripHtml(info.description) : "";
    out.push({
      id: item.id ?? `${title}-${out.length}`,
      titolo: info.subtitle ? `${title}: ${info.subtitle.trim()}` : title,
      autore: authors.length ? authors.join(", ") : null,
      descrizione: description || null,
      copertina_url: normalizeCoverUrl(info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail),
    });
    if (out.length >= GOOGLE_BOOKS_MAX_RESULTS) break;
  }
  return out;
}

export function buildGoogleBooksUrl(query: string, apiKey?: string) {
  const params = new URLSearchParams({
    q: query.trim(),
    maxResults: "10",
    printType: "books",
  });
  if (apiKey) params.set("key", apiKey);
  return `https://www.googleapis.com/books/v1/volumes?${params.toString()}`;
}

export async function searchGoogleBooks(query: string, signal?: AbortSignal) {
  const key = import.meta.env["VITE_GOOGLE_BOOKS_API_KEY"] as string | undefined;
  const res = await fetch(buildGoogleBooksUrl(query, key), { signal: signal ?? null });
  if (res.status === 429) {
    throw new Error("Google Books ha ricevuto troppe ricerche: riprova tra qualche minuto.");
  }
  if (!res.ok) throw new Error(`Ricerca non riuscita (errore ${res.status}).`);
  return parseGoogleBooksResponse(await res.json());
}
