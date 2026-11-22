export const STATI = ["SCARICATO", "COMPRATO", "DA SCARICARE", "DA COMPRARE", "NON TROVATO"] as const;
export const TIPI = ["LIBRO", "EBOOK", "AUDIOLIBRO", "FUMETTO"] as const;

export type Stato = (typeof STATI)[number];
export type Tipo = (typeof TIPI)[number];

export interface Book {
  id: string;
  user_id: string;
  titolo: string;
  autore: string | null;
  stato: Stato | null;
  descrizione: string | null;
  note: string | null;
  letto: boolean;
  data_fine_libro: string | null;
  rating: number | null;
  tipo: Tipo | null;
  copertina_url: string | null;
  /** Priority in "Da leggere": lower comes first. */
  posizione: number;
  pagine: number | null;
  created_at: string;
  updated_at: string;
}

export const STATO_BADGE: Record<
  Stato,
  "scaricato" | "comprato" | "dascaricare" | "dacomprare" | "nontrovato"
> = {
    SCARICATO: "scaricato",
    COMPRATO: "comprato",
    "DA SCARICARE": "dascaricare",
    "DA COMPRARE": "dacomprare",
    "NON TROVATO": "nontrovato",
  };

export const TIPO_LABEL: Record<Tipo, string> = {
  LIBRO: "Libro",
  EBOOK: "Ebook",
  AUDIOLIBRO: "Audiolibro",
  FUMETTO: "Fumetto",
};

function normalize(s: string | null | undefined) {
  return (s ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/** True when the query matches title or author (case and accent insensitive). */
export function matchesQuery(book: Pick<Book, "titolo" | "autore">, query: string) {
  const q = normalize(query);
  if (!q) return true;
  return normalize(book.titolo).includes(q) || normalize(book.autore).includes(q);
}

export function filterToRead(books: Book[], opts: { query: string; stato: Stato | "ALL" }) {
  return books
    .filter((b) => !b.letto)
    .filter((b) => matchesQuery(b, opts.query))
    .filter((b) => opts.stato === "ALL" || b.stato === opts.stato)
    .sort(byPriority);
}

/** "Da leggere" order: posizione ascending, newest first on ties. */
export function byPriority(a: Book, b: Book) {
  return a.posizione - b.posizione || b.created_at.localeCompare(a.created_at);
}

/** Position for a book entering "Da leggere": after every book already there. */
export function nextPosition(books: Book[]) {
  return books.filter((b) => !b.letto).reduce((max, b) => Math.max(max, b.posizione), 0) + 1;
}

/** Moves `activeId` to the slot of `overId` and returns the new id order. */
export function moveId(ids: string[], activeId: string, overId: string): string[] {
  const from = ids.indexOf(activeId);
  const to = ids.indexOf(overId);
  if (from < 0 || to < 0 || from === to) return ids;
  const next = [...ids];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved as string);
  return next;
}

/** Positions 1..n following `orderedIds`, only for books whose position changes. */
export function positionUpdates(books: Book[], orderedIds: string[]) {
  const current = new Map(books.map((b) => [b.id, b.posizione]));
  return orderedIds
    .map((id, i) => ({ id, posizione: i + 1 }))
    .filter((u) => current.get(u.id) !== u.posizione);
}

export function filterRead(
  books: Book[],
  opts: { query: string; tipo: Tipo | "ALL"; rating: number | "ALL" },
) {
  return books
    .filter((b) => b.letto)
    .filter((b) => matchesQuery(b, opts.query))
    .filter((b) => opts.tipo === "ALL" || b.tipo === opts.tipo)
    .filter((b) => opts.rating === "ALL" || b.rating === opts.rating)
    .sort((a, b) => finishedTime(b) - finishedTime(a));
}

function finishedTime(b: Book) {
  return b.data_fine_libro ? new Date(b.data_fine_libro).getTime() : 0;
}

export interface LibraryStats {
  totalRead: number;
  readThisYear: number;
  toRead: number;
}

export function computeStats(books: Book[], now: Date = new Date()): LibraryStats {
  const year = now.getFullYear();
  const read = books.filter((b) => b.letto);
  return {
    totalRead: read.length,
    readThisYear: read.filter(
      (b) => b.data_fine_libro && new Date(b.data_fine_libro).getFullYear() === year,
    ).length,
    toRead: books.length - read.length,
  };
}

export type ActivityKind = "added" | "finished";
export interface Activity {
  book: Book;
  kind: ActivityKind;
  at: string;
}

/** Latest events across "book added" and "book finished", newest first. */
export function recentActivity(books: Book[], limit = 3): Activity[] {
  const events: Activity[] = [];
  for (const book of books) {
    events.push({ book, kind: "added", at: book.created_at });
    if (book.letto && book.data_fine_libro) {
      events.push({ book, kind: "finished", at: book.data_fine_libro });
    }
  }
  events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const seen = new Set<string>();
  const out: Activity[] = [];
  for (const e of events) {
    if (seen.has(e.book.id)) continue;
    seen.add(e.book.id);
    out.push(e);
    if (out.length === limit) break;
  }
  return out;
}

export const CSV_COLUMNS: (keyof Book)[] = [
  "id",
  "titolo",
  "autore",
  "stato",
  "descrizione",
  "note",
  "letto",
  "data_fine_libro",
  "rating",
  "tipo",
  "copertina_url",
  "pagine",
  "posizione",
  "created_at",
];

function csvCell(value: unknown) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function booksToCsv(books: Book[]) {
  const header = CSV_COLUMNS.join(",");
  const rows = books.map((b) => CSV_COLUMNS.map((c) => csvCell(b[c])).join(","));
  return [header, ...rows].join("\r\n");
}

/** Value for <input type="datetime-local"> in the user's local time. */
export function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

/* ---------- Statistiche ---------- */

export const MESI = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

export type YearFilter = number | "ALL";

export interface ReadingStats {
  total: number;
  /** Books read the year before the chosen one (null for "Tutti gli anni"). */
  previousYearTotal: number | null;
  avgPerMonth: number;
  avgRating: number | null;
  ratedCount: number;
  formats: { tipo: Tipo; count: number; pct: number }[];
  favoriteFormat: Tipo | null;
  byMonth: { mese: string; libri: number }[];
  byRating: { stelle: number; count: number }[];
}

function finishYear(b: Book) {
  return b.data_fine_libro ? new Date(b.data_fine_libro).getFullYear() : null;
}

/** Years with at least one finished book, plus the current year, newest first. */
export function readingYears(books: Book[], now: Date = new Date()): number[] {
  const years = new Set<number>([now.getFullYear()]);
  for (const b of books) {
    const y = b.letto ? finishYear(b) : null;
    if (y) years.add(y);
  }
  return [...years].sort((a, b) => b - a);
}

/** Reading statistics from books with letto = true, by data_fine_libro. */
export function readingStats(books: Book[], year: YearFilter, now: Date = new Date()): ReadingStats {
  const read = books.filter((b) => b.letto);
  const scope = year === "ALL" ? read : read.filter((b) => finishYear(b) === year);
  const dated = scope.filter((b) => b.data_fine_libro);

  let months: number;
  if (year === "ALL") {
    const first = dated.reduce<Date | null>((min, b) => {
      const d = new Date(b.data_fine_libro as string);
      return !min || d < min ? d : min;
    }, null);
    months = first
      ? (now.getFullYear() - first.getFullYear()) * 12 + (now.getMonth() - first.getMonth()) + 1
      : 0;
  } else {
    months = year === now.getFullYear() ? now.getMonth() + 1 : 12;
  }
  const monthlyBase = year === "ALL" ? dated.length : scope.length;

  const rated = scope.filter((b) => b.rating !== null);
  const withTipo = scope.filter((b) => b.tipo !== null);
  const formats = TIPI.map((tipo) => {
    const count = withTipo.filter((b) => b.tipo === tipo).length;
    return { tipo, count, pct: withTipo.length ? Math.round((count / withTipo.length) * 100) : 0 };
  });
  const top = formats.reduce((best, f) => (f.count > best.count ? f : best), formats[0]!);

  const byMonth = MESI.map((mese) => ({ mese, libri: 0 }));
  for (const b of dated) byMonth[new Date(b.data_fine_libro as string).getMonth()]!.libri++;

  return {
    total: scope.length,
    previousYearTotal: year === "ALL" ? null : read.filter((b) => finishYear(b) === year - 1).length,
    avgPerMonth: months > 0 ? Math.round((monthlyBase / months) * 10) / 10 : 0,
    avgRating: rated.length
      ? Math.round((rated.reduce((s, b) => s + (b.rating as number), 0) / rated.length) * 10) / 10
      : null,
    ratedCount: rated.length,
    formats,
    favoriteFormat: top.count > 0 ? top.tipo : null,
    byMonth,
    byRating: [1, 2, 3, 4, 5].map((stelle) => ({
      stelle,
      count: rated.filter((b) => b.rating === stelle).length,
    })),
  };
}
