import { describe, expect, it } from "vitest";

import {
  booksToCsv,
  computeStats,
  filterRead,
  filterToRead,
  moveId,
  nextPosition,
  positionUpdates,
  readingStats,
  readingYears,
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
    posizione: 0,
    pagine: null,
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

describe("Priorità Da leggere", () => {
  it("orders unread books by posizione ascending", () => {
    const res = filterToRead(
      [book({ id: "c", posizione: 3 }), book({ id: "a", posizione: 1 }), book({ id: "b", posizione: 2 })],
      { query: "", stato: "ALL" },
    );
    expect(res.map((b) => b.id)).toEqual(["a", "b", "c"]);
  });

  it("filters by the new COMPRATO stato", () => {
    const res = filterToRead(
      [book({ id: "a", stato: "COMPRATO" }), book({ id: "b", stato: "DA COMPRARE" })],
      { query: "", stato: "COMPRATO" },
    );
    expect(res.map((b) => b.id)).toEqual(["a"]);
  });

  it("saves only the positions that changed after a drag", () => {
    const books = [
      book({ id: "a", posizione: 1 }),
      book({ id: "b", posizione: 2 }),
      book({ id: "c", posizione: 3 }),
    ];
    const order = moveId(["a", "b", "c"], "c", "a");
    expect(order).toEqual(["c", "a", "b"]);
    expect(positionUpdates(books, order)).toEqual([
      { id: "c", posizione: 1 },
      { id: "a", posizione: 2 },
      { id: "b", posizione: 3 },
    ]);
    expect(positionUpdates(books, moveId(["a", "b", "c"], "b", "c"))).toEqual([
      { id: "c", posizione: 2 },
      { id: "b", posizione: 3 },
    ]);
  });

  it("puts a new book after the existing unread ones", () => {
    expect(
      nextPosition([book({ posizione: 4 }), book({ posizione: 9, letto: true }), book({ posizione: 2 })]),
    ).toBe(5);
  });
});

describe("Statistiche", () => {
  const now = new Date("2026-06-15T12:00:00Z");
  const books = [
    book({ letto: true, data_fine_libro: "2026-01-10T10:00:00Z", rating: 5, tipo: "LIBRO" }),
    book({ letto: true, data_fine_libro: "2026-01-20T10:00:00Z", rating: 3, tipo: "EBOOK" }),
    book({ letto: true, data_fine_libro: "2026-03-05T10:00:00Z", rating: 4, tipo: "LIBRO" }),
    book({ letto: true, data_fine_libro: "2025-07-05T10:00:00Z", rating: 1, tipo: "AUDIOLIBRO" }),
    book({ letto: false, tipo: "LIBRO" }),
  ];

  it("computes KPIs for the chosen year with previous-year comparison", () => {
    const s = readingStats(books, 2026, now);
    expect(s.total).toBe(3);
    expect(s.previousYearTotal).toBe(1);
    expect(s.avgPerMonth).toBe(0.5); // 3 books over Jan-Jun
    expect(s.avgRating).toBe(4);
    expect(s.favoriteFormat).toBe("LIBRO");
    expect(s.formats.find((f) => f.tipo === "LIBRO")?.pct).toBe(67);
    expect(s.byMonth.map((m) => m.libri).slice(0, 4)).toEqual([2, 0, 1, 0]);
    expect(s.byRating.map((r) => r.count)).toEqual([0, 0, 1, 1, 1]);
  });

  it("uses 12 months for a past year and all books for 'Tutti gli anni'", () => {
    expect(readingStats(books, 2025, now).avgPerMonth).toBe(0.1);
    const all = readingStats(books, "ALL", now);
    expect(all.total).toBe(4);
    expect(all.previousYearTotal).toBeNull();
    expect(all.avgPerMonth).toBe(0.3); // 4 books from Jul 2025 to Jun 2026 = 12 months
  });

  it("lists years with finished books plus the current one, newest first", () => {
    expect(readingYears(books, now)).toEqual([2026, 2025]);
    expect(readingYears([], now)).toEqual([2026]);
  });
});
