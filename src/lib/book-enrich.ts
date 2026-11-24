/**
 * "Completa dati da web": multi-source lookup (Apple Books first, then Open Library)
 * and the no-overwrite rule — only empty fields are ever filled.
 */
import {
  AppleBooksRateLimitError,
  pickBestMatch,
  searchAppleBooks,
  type AppleBookResult,
} from "./apple-books";
import type { Book } from "./books";
import {
  OpenLibraryRateLimitError,
  searchOpenLibraryDetails,
  type OpenLibraryDetails,
} from "./open-library";

export const ENRICH_FIELDS = ["autore", "descrizione", "pagine", "copertina_url"] as const;
export type EnrichField = (typeof ENRICH_FIELDS)[number];

export interface EnrichData {
  autore: string | null;
  descrizione: string | null;
  pagine: number | null;
  copertina_url: string | null;
}

export type EnrichPatch = Partial<EnrichData>;
type Current = Pick<Book, "titolo"> & { [K in EnrichField]?: EnrichData[K] | undefined };

export const FIELD_LABEL: Record<EnrichField, string> = {
  autore: "autore",
  descrizione: "descrizione",
  pagine: "pagine",
  copertina_url: "copertina",
};

function isEmpty(v: string | number | null | undefined) {
  if (v === null || v === undefined) return true;
  if (typeof v === "number") return !(v > 0);
  return v.trim() === "";
}

/** Fields the book does not have yet (empty strings and whitespace count as empty). */
export function missingFields(book: Current): EnrichField[] {
  return ENRICH_FIELDS.filter((f) => isEmpty(book[f]));
}

/** No-overwrite rule: the patch contains only fields empty in `current` and found on the web. */
export function fillOnlyEmpty(current: Current, found: EnrichPatch): EnrichPatch {
  const patch: EnrichPatch = {};
  for (const f of missingFields(current)) {
    const v = found[f];
    if (!isEmpty(v)) (patch as Record<string, unknown>)[f] = typeof v === "string" ? v.trim() : v;
  }
  return patch;
}

/** Apple Books wins for author/description/cover; Open Library fills the gaps and gives pages. */
export function combineSources(
  apple: AppleBookResult | null,
  ol: OpenLibraryDetails | null,
): EnrichPatch {
  const out: EnrichPatch = {};
  const autore = apple?.autore ?? ol?.autore ?? null;
  const descrizione = apple?.descrizione ?? ol?.descrizione ?? null;
  const copertina = apple?.copertina_url ?? ol?.copertina_url ?? null;
  if (autore) out.autore = autore;
  if (descrizione) out.descrizione = descrizione;
  if (ol?.pagine) out.pagine = ol.pagine;
  if (copertina) out.copertina_url = copertina;
  return out;
}

export function isRateLimitError(e: unknown) {
  return e instanceof AppleBooksRateLimitError || e instanceof OpenLibraryRateLimitError;
}

interface Engines {
  apple: (titolo: string, autore: string | null, signal?: AbortSignal) => Promise<AppleBookResult[]>;
  openLibrary: (titolo: string, autore: string | null, signal?: AbortSignal) => Promise<OpenLibraryDetails[]>;
}

const defaultEngines: Engines = { apple: searchAppleBooks, openLibrary: searchOpenLibraryDetails };

/**
 * Looks up the fields the book is missing. Apple Books is asked only when author,
 * description or cover are missing; Open Library whenever something is still missing
 * afterwards (always for pages, which Apple does not provide).
 */
export async function lookupMissingData(
  book: Current,
  signal?: AbortSignal,
  engines: Engines = defaultEngines,
): Promise<EnrichPatch> {
  const needed = missingFields(book);
  if (needed.length === 0 || !book.titolo.trim()) return {};
  const autore = book.autore?.trim() || null;
  const errors: unknown[] = [];

  let apple: AppleBookResult | null = null;
  if (needed.some((f) => f !== "pagine")) {
    try {
      let results = await engines.apple(book.titolo, autore, signal);
      apple = pickBestMatch(results, book.titolo, autore);
      if (!apple && autore) {
        results = await engines.apple(book.titolo, null, signal);
        apple = pickBestMatch(results, book.titolo, autore);
      }
    } catch (e) {
      if ((e as Error | null)?.name === "AbortError") throw e;
      errors.push(e);
    }
  }

  const afterApple = fillOnlyEmpty(book, combineSources(apple, null));
  const stillMissing = needed.filter((f) => !(f in afterApple));
  let ol: OpenLibraryDetails | null = null;
  if (stillMissing.length > 0) {
    try {
      const results = await engines.openLibrary(book.titolo, autore ?? apple?.autore ?? null, signal);
      ol = pickBestMatch(results, book.titolo, autore ?? apple?.autore) ?? results[0] ?? null;
    } catch (e) {
      if ((e as Error | null)?.name === "AbortError") throw e;
      errors.push(e);
    }
  }

  // Both sources failed: report it, so it counts as an error and not as "not found".
  if (!apple && !ol && errors.length > 0) throw errors.find(isRateLimitError) ?? errors[0];
  return fillOnlyEmpty(book, combineSources(apple, ol));
}

/* ---------- Bulk "Completa dati mancanti" ---------- */

export function booksMissingData<T extends Current>(books: T[]): T[] {
  return books.filter((b) => missingFields(b).length > 0);
}

export interface EnrichProgress {
  total: number;
  processed: number;
  /** Books where at least one field was filled. */
  completed: number;
  notFound: number;
  failed: number;
  /** Total number of fields filled. */
  fields: number;
  current: string | null;
}

interface RunOptions {
  find: (book: Book, signal?: AbortSignal) => Promise<EnrichPatch>;
  /** Saves the patch; returns how many fields were actually written. */
  save: (book: Book, patch: EnrichPatch) => Promise<number>;
  onProgress?: (p: EnrichProgress) => void;
  signal?: AbortSignal;
  isRateLimit?: (e: unknown) => boolean;
  /** Pause after a rate-limit error before retrying once. */
  retryDelayMs?: number;
  /** Pause between books, to stay under the free APIs' limits. */
  delayMs?: number;
  wait?: (ms: number) => Promise<void>;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function fillMissingData(books: Book[], opts: RunOptions): Promise<EnrichProgress> {
  const todo = booksMissingData(books);
  const wait = opts.wait ?? sleep;
  const p: EnrichProgress = {
    total: todo.length,
    processed: 0,
    completed: 0,
    notFound: 0,
    failed: 0,
    fields: 0,
    current: null,
  };
  opts.onProgress?.({ ...p });

  for (const [i, book] of todo.entries()) {
    if (opts.signal?.aborted) break;
    if (i > 0 && opts.delayMs) await wait(opts.delayMs);
    if (opts.signal?.aborted) break;
    p.current = book.titolo;
    opts.onProgress?.({ ...p });
    try {
      let patch: EnrichPatch;
      try {
        patch = await opts.find(book, opts.signal);
      } catch (e) {
        if (!opts.isRateLimit?.(e)) throw e;
        await wait(opts.retryDelayMs ?? 60_000);
        if (opts.signal?.aborted) break;
        patch = await opts.find(book, opts.signal);
      }
      const written = Object.keys(patch).length > 0 ? await opts.save(book, patch) : 0;
      if (written > 0) {
        p.completed++;
        p.fields += written;
      } else {
        p.notFound++;
      }
    } catch (e) {
      if ((e as Error | null)?.name === "AbortError") break;
      p.failed++;
    }
    p.processed++;
    opts.onProgress?.({ ...p });
  }
  p.current = null;
  opts.onProgress?.({ ...p });
  return p;
}
