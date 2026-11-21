/** Bulk "Recupera copertine mancanti": pure runner with injected search/save so it is testable. */
import type { Book } from "./books";

export function hasCover(book: Pick<Book, "copertina_url">) {
  return Boolean(book.copertina_url?.trim());
}

export function booksMissingCover<T extends Pick<Book, "copertina_url">>(books: T[]): T[] {
  return books.filter((b) => !hasCover(b));
}

export interface CoverFetchProgress {
  total: number;
  processed: number;
  found: number;
  notFound: number;
  failed: number;
  current: string | null;
}

interface RunOptions {
  /** Returns the first cover URL for the book, or null when there is none. */
  find: (book: Book, signal?: AbortSignal) => Promise<string | null>;
  save: (book: Book, url: string) => Promise<void>;
  onProgress?: (p: CoverFetchProgress) => void;
  signal?: AbortSignal;
  /** Wait before retrying once after a rate-limit error. */
  isRateLimit?: (e: unknown) => boolean;
  retryDelayMs?: number;
  wait?: (ms: number) => Promise<void>;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function fetchMissingCovers(books: Book[], opts: RunOptions): Promise<CoverFetchProgress> {
  const todo = booksMissingCover(books);
  const wait = opts.wait ?? sleep;
  const p: CoverFetchProgress = { total: todo.length, processed: 0, found: 0, notFound: 0, failed: 0, current: null };
  opts.onProgress?.({ ...p });

  for (const book of todo) {
    if (opts.signal?.aborted) break;
    p.current = book.titolo;
    opts.onProgress?.({ ...p });
    try {
      let url: string | null;
      try {
        url = await opts.find(book, opts.signal);
      } catch (e) {
        if (!opts.isRateLimit?.(e)) throw e;
        await wait(opts.retryDelayMs ?? 5000);
        url = await opts.find(book, opts.signal);
      }
      if (url) {
        await opts.save(book, url);
        p.found++;
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
