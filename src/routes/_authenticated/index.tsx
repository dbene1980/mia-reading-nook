import { Link, createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ArrowRight, BookMarked, BookOpenCheck, CalendarCheck } from "lucide-react";
import { useMemo } from "react";

import { ExLibrisStamp } from "@/components/brand/ex-libris-stamp";
import { FourPointStar, OrnamentRule } from "@/components/brand/ornaments";
import { AppShell } from "@/components/layout/app-shell";
import { BookCover } from "@/components/library/book-cover";
import { EmptyState } from "@/components/library/empty-state";
import { StarRating } from "@/components/library/star-rating";
import { computeStats, recentActivity } from "@/lib/books";
import { useBooks } from "@/lib/books-data";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Ex Libris · La Libreria di Daniele" },
      { name: "description", content: "Il riepilogo della tua libreria: letti, quest'anno, da leggere." },
      { property: "og:title", content: "Ex Libris · La Libreria di Daniele" },
      { property: "og:description", content: "Il riepilogo della tua libreria: letti, quest'anno, da leggere." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { books } = useBooks();
  const stats = useMemo(() => computeStats(books), [books]);
  const recent = useMemo(() => recentActivity(books, 3), [books]);
  const year = new Date().getFullYear();

  const cards = [
    { label: "Libri letti", value: stats.totalRead, icon: BookOpenCheck, to: "/libri-letti" as const },
    { label: `Letti nel ${year}`, value: stats.readThisYear, icon: CalendarCheck, to: "/libri-letti" as const },
    { label: "Da leggere", value: stats.toRead, icon: BookMarked, to: "/da-leggere" as const },
  ];

  return (
    <AppShell>
      <div className="grid grid-cols-1 min-w-0 max-w-full gap-8 sm:gap-10">
        <header className="grid grid-cols-1 min-w-0 gap-5">
          <div className="flex min-w-0 flex-col items-start gap-3 min-[480px]:flex-row min-[480px]:items-center min-[480px]:gap-6">
            <ExLibrisStamp className="size-16 min-[480px]:size-20 sm:size-28" />
            <div className="min-w-0 max-w-full">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                <FourPointStar className="size-2.5 shrink-0 text-primary" />
                <span className="break-words">Bentornato, Daniele</span>
              </p>
              <h1 className="mt-1.5 break-words text-2xl leading-tight sm:text-4xl">
                <span className="block text-sm tracking-[0.24em] text-gold min-[480px]:text-base min-[480px]:tracking-[0.3em] sm:text-xl">
                  Ex Libris —
                </span>
                La Libreria di Daniele
              </h1>
            </div>
          </div>
          <OrnamentRule />
        </header>

        <div className="grid min-w-0 max-w-full grid-cols-3 gap-2 sm:gap-4">
          {cards.map((c, i) => (
            <Link
              key={c.label}
              to={c.to}
              style={{ animationDelay: `${i * 60}ms` }}
              className="group relative min-w-0 animate-rise overflow-hidden ink-card p-2.5 shadow-card min-[480px]:p-3 sm:p-5 transition-all hover:-translate-y-0.5 hover:border-gold hover:shadow-lift"
            >
              <c.icon className="size-5 text-gold" />
              <p className="mt-3 font-display text-2xl font-semibold tabular-nums min-[400px]:text-3xl sm:mt-6 sm:text-5xl">
                {c.value}
              </p>
              <p className="mt-1 flex items-center gap-1 text-[11px] leading-tight text-muted-foreground min-[400px]:text-xs sm:text-sm">
                <span className="break-words">{c.label}</span>
                <ArrowRight className="hidden size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 sm:inline" />
              </p>
            </Link>
          ))}
        </div>

        <section className="grid grid-cols-1 min-w-0 max-w-full gap-4">
          <h2 className="text-xl">Attività recente</h2>
          {recent.length === 0 ? (
            <EmptyState title="Nessuna attività">
              I libri aggiunti o completati di recente compariranno qui.
            </EmptyState>
          ) : (
            <div className="grid grid-cols-1 min-w-0 max-w-full gap-3 sm:grid-cols-3">
              {recent.map(({ book, kind, at }, i) => (
                <div
                  key={book.id}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className="flex min-w-0 max-w-full animate-rise gap-3 ink-card p-3 shadow-card"
                >
                  <BookCover
                    url={book.copertina_url}
                    titolo={book.titolo}
                    autore={book.autore}
                    className="w-14"
                    read={kind === "finished"}
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span
                      className={
                        kind === "finished"
                          ? "text-[10px] font-semibold uppercase tracking-[0.16em] text-gold"
                          : "text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
                      }
                    >
                      {kind === "finished" ? "Completato" : "Aggiunto"}
                    </span>
                    <p className="line-clamp-2 break-words font-serif text-sm font-medium leading-snug">{book.titolo}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(at), "d MMM yyyy", { locale: it })}
                    </p>
                    {kind === "finished" && <StarRating value={book.rating} />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
