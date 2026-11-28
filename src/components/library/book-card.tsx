import { Check, Magnet } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { formatBookCopyText, type Book } from "@/lib/books";
import { cn } from "@/lib/utils";

import { BookCover } from "./book-cover";
import { StatoBadge, TipoBadge } from "./book-badges";

interface BookCardProps {
  book: Book;
  onOpen: (book: Book) => void;
  index?: number;
  /** Optional drag handle rendered on the right edge of the card. */
  handle?: ReactNode;
}

async function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall back to execCommand when Clipboard API is blocked (e.g. non-secure context).
    }
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  try {
    const ok = document.execCommand("copy");
    if (!ok) throw new Error("Copy failed");
  } finally {
    document.body.removeChild(area);
  }
}

export function BookCard({ book, onOpen, index = 0, handle }: BookCardProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  async function handleCopy() {
    const text = formatBookCopyText(book);
    try {
      await copyToClipboard(text);
      setCopied(true);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setCopied(false), 1500);
      toast.success(`Copiato: "${text}"`);
    } catch {
      toast.error("Impossibile copiare negli appunti");
    }
  }

  return (
    <div
      style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
      className="group flex min-w-0 max-w-full animate-rise items-stretch ink-card shadow-card transition-all hover:border-gold hover:shadow-lift"
    >
      <button
        type="button"
        onClick={() => onOpen(book)}
        className="flex min-w-0 flex-1 gap-3 rounded-xl p-2.5 pr-1.5 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-[480px]:gap-4 min-[480px]:p-3 min-[480px]:pr-2"
      >
        <BookCover
          url={book.copertina_url}
          titolo={book.titolo}
          autore={book.autore}
          className="w-16 min-[480px]:w-20 sm:w-24"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 py-0.5">
          <h3 className="line-clamp-2 break-words text-base font-medium leading-snug text-foreground group-hover:text-primary">
            {book.titolo}
          </h3>
          {book.autore && <p className="truncate text-sm text-muted-foreground">{book.autore}</p>}
          {book.descrizione && (
            <p className="line-clamp-2 break-words text-xs leading-relaxed text-muted-foreground/80">
              {book.descrizione}
            </p>
          )}
          <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
            <StatoBadge stato={book.stato} />
            <TipoBadge tipo={book.tipo} />
            {book.pagine && (
              <span className="text-[11px] tabular-nums text-muted-foreground">
                {book.pagine} pagine
              </span>
            )}
          </div>
        </div>
      </button>
      <button
        type="button"
        onClick={() => void handleCopy()}
        aria-label={`Copia titolo e autore di "${book.titolo}"`}
        title="Copia titolo e autore"
        className={cn(
          "mt-2 mr-2 inline-flex size-7 shrink-0 cursor-pointer self-start items-center justify-center rounded-[var(--radius)] border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-[480px]:mt-2.5 min-[480px]:mr-2.5",
          copied
            ? "border-gold bg-gold/15 text-gold"
            : "border-line/60 bg-surface/60 text-muted-foreground hover:border-gold hover:bg-gold/10 hover:text-gold",
        )}
      >
        {copied ? <Check className="size-3.5" /> : <Magnet className="size-3.5" />}
      </button>
      {handle}
    </div>
  );
}
