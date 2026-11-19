import { Link, createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ArrowRight, BookMarked, BookOpenCheck, CalendarCheck } from "lucide-react";
import { useMemo } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { BookCover } from "@/components/library/book-cover";
import { EmptyState } from "@/components/library/empty-state";
import { PageHeader } from "@/components/library/page-header";
import { StarRating } from "@/components/library/star-rating";
import { computeStats, recentActivity } from "@/lib/books";
import { useBooks } from "@/lib/books-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home · La mia libreria" },
      { name: "description", content: "Il riepilogo della tua libreria: letti, quest'anno, da leggere." },
      { property: "og:title", content: "Home · La mia libreria" },
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
      <div className="grid gap-10">
        <PageHeader eyebrow="Bentornato" title="La tua libreria" />

        <div className="grid gap-4 sm:grid-cols-3">
          {cards.map((c, i) => (
            <Link
              key={c.label}
              to={c.to}
              style={{ animationDelay: `${i * 60}ms` }}
              className="group relative animate-rise overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift"
            >
              <c.icon className="size-5 text-primary" />
              <p className="mt-6 font-display text-5xl font-medium tabular-nums">{c.value}</p>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                {c.label}
                <ArrowRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
              </p>
            </Link>
          ))}
        </div>

        <section className="grid gap-4">
          <h2 className="text-xl">Attività recente</h2>
          {recent.length === 0 ? (
            <EmptyState title="Nessuna attività">
              I libri aggiunti o completati di recente compariranno qui.
            </EmptyState>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {recent.map(({ book, kind, at }, i) => (
                <div
                  key={book.id}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className="flex animate-rise gap-3 rounded-xl border border-border bg-card p-3 shadow-card"
                >
                  <BookCover url={book.copertina_url} titolo={book.titolo} className="w-14" />
                  <div className="flex min-w-0 flex-col gap-1">
                    <span
                      className={
                        kind === "finished"
                          ? "text-[10px] font-semibold uppercase tracking-wider text-success"
                          : "text-[10px] font-semibold uppercase tracking-wider text-primary"
                      }
                    >
                      {kind === "finished" ? "Completato" : "Aggiunto"}
                    </span>
                    <p className="line-clamp-2 text-sm font-medium leading-snug">{book.titolo}</p>
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
