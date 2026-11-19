import { describe, expect, it } from "vitest";

import {
  booksToCsv,
  computeStats,
  filterRead,
  filterToRead,
  recentActivity,
  type Book,
} from "@/lib/books";

function book(p: Partial<Book>): Book {
  return {
    id: p.id ?? Math.random().toString(36).slice(2),
    user_id: "u1",
    titolo: "Senza titolo",
    autore: null,
    stato: null,
    descrizione: null,
    note: null,
    letto: false,
    data_fine_libro: null,
    rating: null,
    tipo: null,
    copertina_url: null,
    created_at: "2026-01-01T10:00:00Z",
    updated_at: "2026-01-01T10:00:00Z",
    ...p,
  };
}

describe("Da leggere", () => {
  it("shows only unread books", () => {
    const res = filterToRead([book({ id: "a" }), book({ id: "b", letto: true })], {
      query: "",
      stato: "ALL",
    });
    expect(res.map((b) => b.id)).toEqual(["a"]);
  });

  it("searches by author ignoring accents and case", () => {
    const res = filterToRead(
      [book({ id: "a", autore: "Elsa Morante" }), book({ id: "b", titolo: "Niccolò" })],
      { query: "niccolo", stato: "ALL" },
    );
    expect(res.map((b) => b.id)).toEqual(["b"]);
  });

  it("filters by stato", () => {
    const res = filterToRead(
      [book({ id: "a", stato: "DA COMPRARE" }), book({ id: "b", stato: "SCARICATO" })],
      { query: "", stato: "SCARICATO" },
    );
    expect(res.map((b) => b.id)).toEqual(["b"]);
  });
});

describe("Libri letti", () => {
  it("orders by finish date, most recent first, and filters by rating", () => {
    const books = [
      book({ id: "old", letto: true, rating: 5, data_fine_libro: "2025-03-01T10:00:00Z" }),
      book({ id: "new", letto: true, rating: 5, data_fine_libro: "2026-05-01T10:00:00Z" }),
      book({ id: "low", letto: true, rating: 2, data_fine_libro: "2026-06-01T10:00:00Z" }),
    ];
    expect(filterRead(books, { query: "", tipo: "ALL", rating: 5 }).map((b) => b.id)).toEqual([
      "new",
      "old",
    ]);
  });
});

describe("Home", () => {
  it("counts books read in the current year", () => {
    const stats = computeStats(
      [
        book({ letto: true, data_fine_libro: "2026-02-01T10:00:00Z" }),
        book({ letto: true, data_fine_libro: "2025-12-31T10:00:00Z" }),
        book({}),
      ],
      new Date("2026-11-19T12:00:00Z"),
    );
    expect(stats).toEqual({ totalRead: 2, readThisYear: 1, toRead: 1 });
  });

  it("returns the last 3 books added or completed", () => {
    const res = recentActivity([
      book({ id: "a", created_at: "2026-01-01T00:00:00Z" }),
      book({ id: "b", created_at: "2026-02-01T00:00:00Z" }),
      book({
        id: "c",
        created_at: "2025-01-01T00:00:00Z",
        letto: true,
        data_fine_libro: "2026-10-01T00:00:00Z",
      }),
      book({ id: "d", created_at: "2026-03-01T00:00:00Z" }),
    ]);
    expect(res.map((e) => [e.book.id, e.kind])).toEqual([
      ["c", "finished"],
      ["d", "added"],
      ["b", "added"],
    ]);
  });
});

describe("CSV export", () => {
  it("escapes commas and quotes", () => {
    const csv = booksToCsv([book({ id: "x", titolo: 'Il "nome", della rosa' })]);
    expect(csv.split("\r\n")[1]).toContain('"Il ""nome"", della rosa"');
  });
});
