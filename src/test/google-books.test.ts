import { describe, expect, it } from "vitest";

import { buildGoogleBooksUrl, parseGoogleBooksResponse } from "@/lib/google-books";

const vol = (n: number, extra: Record<string, unknown> = {}) => ({
  id: `v${n}`,
  volumeInfo: { title: `Libro ${n}`, authors: ["A. Autore"], ...extra },
});

describe("Google Books search", () => {
  it("keeps only the first 5 results", () => {
    const items = Array.from({ length: 8 }, (_, i) => vol(i));
    expect(parseGoogleBooksResponse({ items }).map((r) => r.id)).toEqual(["v0", "v1", "v2", "v3", "v4"]);
  });

  it("maps title, authors, description and cover", () => {
    const [r] = parseGoogleBooksResponse({
      items: [
        vol(1, {
          title: "Il nome della rosa",
          authors: ["Umberto Eco", "Altro"],
          description: "<p>Un <b>giallo</b> medievale.</p>",
          imageLinks: { thumbnail: "http://books.google.com/x?id=1&edge=curl&zoom=1" },
        }),
      ],
    });
    expect(r).toEqual({
      id: "v1",
      titolo: "Il nome della rosa",
      autore: "Umberto Eco, Altro",
      descrizione: "Un giallo medievale.",
      copertina_url: "https://books.google.com/x?id=1&zoom=1",
    });
  });

  it("returns no results when Google sends none", () => {
    expect(parseGoogleBooksResponse({ totalItems: 0 })).toEqual([]);
  });

  it("encodes the search text", () => {
    expect(buildGoogleBooksUrl(" la luna & io ")).toContain("q=la+luna+%26+io");
  });
});
