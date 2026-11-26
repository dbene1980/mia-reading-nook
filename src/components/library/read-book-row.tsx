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
      role="button"
      tabIndex={0}
      onClick={() => onEdit(book)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEdit(book);
        }
      }}
      style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
      className="group flex min-w-0 max-w-full cursor-pointer animate-rise gap-3 ink-card p-3 shadow-card transition-all hover:border-gold hover:shadow-lift focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-[480px]:gap-4 sm:p-4"
    >
      <BookCover url={book.copertina_url} titolo={book.titolo} autore={book.autore} className="w-16 sm:w-20" read />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex min-w-0 flex-col gap-2 min-[480px]:flex-row min-[480px]:items-start min-[480px]:justify-between">
          <div className="min-w-0">
            <h3 className="break-words text-base font-medium leading-snug text-foreground group-hover:text-primary">
              {book.titolo}
            </h3>
            {book.autore && <p className="truncate text-sm text-muted-foreground">{book.autore}</p>}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(book);
              }}
              aria-label="Modifica"
            >
              <Pencil /> <span className="hidden sm:inline">Modifica</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onUnread(book);
              }}
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
