/** Book lookup for the "Aggiungi libro" dialog: Google Books first, Open Library when Google fails. */
import { searchGoogleBooks, type GoogleBookResult } from "./google-books";
import { searchOpenLibrary } from "./open-library";

export type BookSearchSource = "google" | "openlibrary";

export interface BookSearchOutcome {
  source: BookSearchSource;
  results: GoogleBookResult[];
}

type Searcher = (query: string, signal?: AbortSignal) => Promise<GoogleBookResult[]>;

function isAbort(e: unknown) {
  return (e as Error | null)?.name === "AbortError";
}

export async function searchBooks(
  query: string,
  signal?: AbortSignal,
  engines: { google: Searcher; openLibrary: Searcher } = {
    google: searchGoogleBooks,
    openLibrary: searchOpenLibrary,
  },
): Promise<BookSearchOutcome> {
  try {
    return { source: "google", results: await engines.google(query, signal) };
  } catch (e) {
    // Any Google failure (429 rate limit, network, other errors) falls back to Open Library.
    if (isAbort(e)) throw e;
    return { source: "openlibrary", results: await engines.openLibrary(query, signal) };
  }
}
