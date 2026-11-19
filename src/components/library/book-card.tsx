import type { Book } from "@/lib/books";

import { BookCover } from "./book-cover";
import { StatoBadge, TipoBadge } from "./book-badges";

interface BookCardProps {
  book: Book;
  onOpen: (book: Book) => void;
  index?: number;
}

export function BookCard({ book, onOpen, index = 0 }: BookCardProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(book)}
      style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
      className="group flex animate-rise gap-4 rounded-xl border border-border bg-card p-3 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <BookCover url={book.copertina_url} titolo={book.titolo} className="w-16 sm:w-20" />
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
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          <StatoBadge stato={book.stato} />
          <TipoBadge tipo={book.tipo} />
        </div>
      </div>
    </button>
  );
}
