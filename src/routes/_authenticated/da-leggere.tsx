import { createFileRoute } from "@tanstack/react-router";
import { GripVertical, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { BookFormDialog } from "@/components/library/book-form-dialog";
import { EmptyState } from "@/components/library/empty-state";
import { MissingDataButton } from "@/components/library/missing-data-button";
import { MarkReadDialog } from "@/components/library/mark-read-dialog";
import { PageHeader } from "@/components/library/page-header";
import { SortableBookList } from "@/components/library/sortable-book-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { STATI, filterToRead, type Stato } from "@/lib/books";
import { useBooks } from "@/lib/books-data";
import { useBookActions } from "@/lib/use-book-actions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/da-leggere")({
  head: () => ({
    meta: [
      { title: "Da leggere · La Libreria di Daniele" },
      { name: "description", content: "I libri che ti aspettano, in ordine di priorità, con ricerca e filtri." },
      { property: "og:title", content: "Da leggere · La Libreria di Daniele" },
      { property: "og:description", content: "I libri che ti aspettano, con ricerca e filtri per stato." },
    ],
  }),
  component: ToReadPage,
});

function ToReadPage() {
  const { books, isLoading } = useBooks();
  const actions = useBookActions();
  const [query, setQuery] = useState("");
  const [stato, setStato] = useState<Stato | "ALL">("ALL");
  const list = useMemo(() => filterToRead(books, { query, stato }), [books, query, stato]);
  const scope = useMemo(() => books.filter((b) => !b.letto), [books]);
  const total = scope.length;
  const canReorder = !query.trim() && stato === "ALL";

  return (
    <AppShell>
      <div className="grid grid-cols-1 min-w-0 max-w-full gap-6 sm:gap-8">
        <PageHeader
          eyebrow={`${total} in attesa`}
          title="Da leggere"
          actions={
            <div className="flex w-full min-w-0 flex-col gap-2 min-[480px]:w-auto min-[480px]:flex-row min-[480px]:flex-wrap">
              <MissingDataButton books={scope} className="w-full min-[480px]:w-auto" />
              <Button onClick={actions.openNew} className="w-full min-[480px]:w-auto">
                <Plus /> Aggiungi libro
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-1 min-w-0 max-w-full gap-3">
          <div className="relative min-w-0 w-full">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca per titolo o autore"
              className="w-full pl-9"
            />
          </div>
          <div
            role="group"
            aria-label="Filtra per stato"
            className="flex w-full max-w-full min-w-0 items-center gap-2 overflow-x-auto pb-1"
          >
            <button
              type="button"
              onClick={() => setStato("ALL")}
              aria-pressed={stato === "ALL"}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors cursor-pointer",
                stato === "ALL"
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-line/70 bg-card text-muted-foreground hover:border-gold/60 hover:text-foreground",
              )}
            >
              Tutti gli stati
            </button>
            {STATI.map((s) => {
              const active = stato === s;
              const isReading = s === "STO LEGGENDO";
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStato(s)}
                  aria-pressed={active}
                  className={cn(
                    "shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors cursor-pointer",
                    isReading
                      ? active
                        ? "border-gold/60 bg-primary text-primary-foreground shadow-sm"
                        : "border-primary/70 bg-primary/15 text-foreground hover:border-gold hover:bg-primary/25"
                      : active
                        ? "border-gold bg-gold/15 text-gold"
                        : "border-line/70 bg-card text-muted-foreground hover:border-gold/60 hover:text-foreground",
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 min-w-0 max-w-full gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-[var(--radius)]" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState title={total === 0 ? "Nessun libro in lista" : "Nessun risultato"}>
            {total === 0
              ? "Aggiungi il primo libro che vuoi leggere."
              : "Prova a cambiare la ricerca o il filtro."}
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 min-w-0 max-w-full gap-3">
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <GripVertical className="mt-0.5 size-3.5 shrink-0" />
              <span>
                {canReorder
                  ? "Trascina la maniglia a destra per cambiare la priorità: i libri 'STO LEGGENDO' restano sempre in cima."
                  : "Togli ricerca e filtro per riordinare i libri."}
              </span>
            </p>
            <SortableBookList
              books={list}
              onOpen={actions.openEdit}
              enabled={canReorder}
              onReorder={(ids) => void actions.reorder(scope, ids)}
            />
          </div>
        )}
      </div>

      <BookFormDialog
        open={actions.formOpen}
        onOpenChange={actions.setFormOpen}
        book={actions.editing}
        onSave={actions.save}
        onDelete={actions.remove}
        onSaveCover={actions.saveCover}
        onMarkRead={actions.startMarkRead}
      />
      <MarkReadDialog
        book={actions.marking}
        open={Boolean(actions.marking)}
        onOpenChange={(o) => !o && actions.closeMarkRead()}
        onConfirm={actions.confirmMarkRead}
      />
    </AppShell>
  );
}
