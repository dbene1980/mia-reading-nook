import { describe, expect, it } from "vitest";

import { searchBooks } from "@/lib/book-search";
import { buildOpenLibraryUrl, parseOpenLibraryResponse } from "@/lib/open-library";

describe("Open Library search", () => {
  it("asks Open Library for 5 results", () => {
    const url = new URL(buildOpenLibraryUrl("  il nome della rosa "));
    expect(url.origin + url.pathname).toBe("https://openlibrary.org/search.json");
    expect(url.searchParams.get("q")).toBe("il nome della rosa");
    expect(url.searchParams.get("limit")).toBe("5");
  });

  it("maps title, first author and cover_i to the cover URL", () => {
    const [r] = parseOpenLibraryResponse({
      docs: [{ key: "/works/OL1W", title: "Il nome della rosa", author_name: ["Umberto Eco", "Altro"], cover_i: 12345 }],
    });
    expect(r).toMatchObject({
      titolo: "Il nome della rosa",
      autore: "Umberto Eco",
      copertina_url: "https://covers.openlibrary.org/b/id/12345-M.jpg",
    });
  });

  it("leaves the cover empty when cover_i is missing", () => {
    const [r] = parseOpenLibraryResponse({ docs: [{ title: "Senza copertina" }] });
    expect(r?.copertina_url).toBeNull();
    expect(r?.autore).toBeNull();
  });

  it("keeps only the first 5 results", () => {
    const docs = Array.from({ length: 8 }, (_, i) => ({ key: `k${i}`, title: `Libro ${i}` }));
    expect(parseOpenLibraryResponse({ docs })).toHaveLength(5);
  });
});

describe("Book search fallback", () => {
  const ol = [{ id: "ol", titolo: "Da Open Library", autore: null, descrizione: null, copertina_url: null }];

  it("uses Open Library when Google Books is rate-limited", async () => {
    const out = await searchBooks("x", undefined, {
      google: async () => {
        throw new Error("Google Books ha ricevuto troppe ricerche");
      },
      openLibrary: async () => ol,
    });
    expect(out).toEqual({ source: "openlibrary", results: ol });
  });

  it("does not call Open Library when Google Books answers", async () => {
    let olCalls = 0;
    const out = await searchBooks("x", undefined, {
      google: async () => [],
      openLibrary: async () => {
        olCalls++;
        return ol;
      },
    });
    expect(out.source).toBe("google");
    expect(olCalls).toBe(0);
  });
});
