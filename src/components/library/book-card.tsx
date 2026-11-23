import type { ReactNode } from "react";

import type { Book } from "@/lib/books";

import { BookCover } from "./book-cover";
import { StatoBadge, TipoBadge } from "./book-badges";

interface BookCardProps {
  book: Book;
  onOpen: (book: Book) => void;
  index?: number;
  /** Optional drag handle rendered on the right edge of the card. */
  handle?: ReactNode;
}

export function BookCard({ book, onOpen, index = 0, handle }: BookCardProps) {
  return (
    <div
      style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
      className="group flex animate-rise items-stretch ink-card shadow-card transition-all hover:border-gold hover:shadow-lift"
    >
      <button
        type="button"
        onClick={() => onOpen(book)}
        className="flex min-w-0 flex-1 gap-4 rounded-xl p-3 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <BookCover url={book.copertina_url} titolo={book.titolo} autore={book.autore} className="w-20 sm:w-24" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 py-0.5">
          <h3 className="line-clamp-2 text-base font-medium leading-snug text-foreground group-hover:text-primary">
            {book.titolo}
          </h3>
          {book.autore && <p className="truncate text-sm text-muted-foreground">{book.autore}</p>}
          {book.descrizione && (
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground/80">
              {book.descrizione}
            </p>
          )}
          <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
            <StatoBadge stato={book.stato} />
            <TipoBadge tipo={book.tipo} />
            {book.pagine && (
              <span className="text-[11px] tabular-nums text-muted-foreground">{book.pagine} pagine</span>
            )}
          </div>
        </div>
      </button>
      {handle}
    </div>
  );
}
