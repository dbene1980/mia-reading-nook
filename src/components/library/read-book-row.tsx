import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Pencil, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Book } from "@/lib/books";

import { BookCover } from "./book-cover";
import { TipoBadge } from "./book-badges";
import { StarRating } from "./star-rating";

interface ReadBookRowProps {
  book: Book;
  onEdit: (book: Book) => void;
  onUnread: (book: Book) => void;
  index?: number;
}

export function ReadBookRow({ book, onEdit, onUnread, index = 0 }: ReadBookRowProps) {
  return (
    <article
      style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
      className="flex animate-rise gap-4 rounded-xl border border-border bg-card p-3 shadow-card sm:p-4"
    >
      <BookCover url={book.copertina_url} titolo={book.titolo} autore={book.autore} className="w-16 sm:w-20" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-base font-medium leading-snug">{book.titolo}</h3>
            {book.autore && <p className="text-sm text-muted-foreground">{book.autore}</p>}
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => onEdit(book)} aria-label="Modifica">
              <Pencil /> <span className="hidden sm:inline">Modifica</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onUnread(book)}
              aria-label="Riporta in Da leggere"
            >
              <Undo2 /> <span className="hidden sm:inline">Da leggere</span>
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span>
            {book.data_fine_libro
              ? format(new Date(book.data_fine_libro), "d MMM yyyy, HH:mm", { locale: it })
              : "Data non indicata"}
          </span>
          <StarRating value={book.rating} />
          <TipoBadge tipo={book.tipo} />
        </div>
        {book.note && (
          <p className="border-l-2 border-primary/40 pl-3 text-sm italic leading-relaxed text-foreground/80">
            {book.note}
          </p>
        )}
      </div>
    </article>
  );
}
