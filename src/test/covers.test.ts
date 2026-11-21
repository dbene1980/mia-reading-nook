import { describe, expect, it } from "vitest";

import type { Book } from "@/lib/books";
import { booksMissingCover, fetchMissingCovers } from "@/lib/cover-fetch";
import { buildOpenLibraryCoverSearchUrl, parseCoverCandidates } from "@/lib/open-library";

const book = (id: string, copertina_url: string | null, titolo = `Libro ${id}`) =>
  ({ id, titolo, autore: "Autore", copertina_url }) as Book;

describe("Cover search on Open Library", () => {
  it("searches by title and author with 5 results", () => {
    const url = new URL(buildOpenLibraryCoverSearchUrl("Il nome della rosa", "Umberto Eco"));
    expect(url.origin + url.pathname).toBe("https://openlibrary.org/search.json");
    expect(url.searchParams.get("title")).toBe("Il nome della rosa");
    expect(url.searchParams.get("author")).toBe("Umberto Eco");
    expect(url.searchParams.get("limit")).toBe("5");
  });

  it("leaves out the author when it is empty", () => {
    const url = new URL(buildOpenLibraryCoverSearchUrl("Solo titolo", "  "));
    expect(url.searchParams.has("author")).toBe(false);
  });

  it("builds the medium cover URL from cover_i and skips results without a cover", () => {
    const list = parseCoverCandidates({
      docs: [{ title: "A" }, { title: "B", cover_i: 42 }, { title: "C", cover_i: 42 }, { title: "D", cover_i: 7 }],
    });
    expect(list.map((c) => c.url)).toEqual([
      "https://covers.openlibrary.org/b/id/42-M.jpg",
      "https://covers.openlibrary.org/b/id/7-M.jpg",
    ]);
  });
});

describe("Recupera copertine mancanti", () => {
  it("only scans books with an empty cover", () => {
    const list = [book("1", null), book("2", "https://x/y.jpg"), book("3", "  ")];
    expect(booksMissingCover(list).map((b) => b.id)).toEqual(["1", "3"]);
  });

  it("saves the first match and counts the books without a match", async () => {
    const saved: Array<[string, string]> = [];
    const result = await fetchMissingCovers([book("1", null), book("2", "https://ok"), book("3", null)], {
      find: async (b) => (b.id === "1" ? "https://covers.openlibrary.org/b/id/1-M.jpg" : null),
      save: async (b, url) => {
        saved.push([b.id, url]);
      },
    });
    expect(saved).toEqual([["1", "https://covers.openlibrary.org/b/id/1-M.jpg"]]);
    expect(result).toMatchObject({ total: 2, processed: 2, found: 1, notFound: 1, failed: 0 });
  });

  it("stops when cancelled", async () => {
    const ctrl = new AbortController();
    const result = await fetchMissingCovers([book("1", null), book("2", null), book("3", null)], {
      signal: ctrl.signal,
      find: async () => {
        ctrl.abort();
        return null;
      },
      save: async () => {},
    });
    expect(result.processed).toBe(1);
  });

  it("retries once after a rate limit", async () => {
    let calls = 0;
    const result = await fetchMissingCovers([book("1", null)], {
      find: async () => {
        calls++;
        if (calls === 1) throw new Error("429");
        return "https://c";
      },
      save: async () => {},
      isRateLimit: () => true,
      wait: async () => {},
    });
    expect(calls).toBe(2);
    expect(result.found).toBe(1);
  });
});
