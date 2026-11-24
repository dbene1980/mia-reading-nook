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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { STATI, filterToRead, type Stato } from "@/lib/books";
import { useBooks } from "@/lib/books-data";
import { useBookActions } from "@/lib/use-book-actions";

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
      <div className="grid gap-8">
        <PageHeader
          eyebrow={`${total} in attesa`}
          title="Da leggere"
          actions={
            <div className="flex flex-wrap gap-2">
              <MissingDataButton books={scope} />
              <Button onClick={actions.openNew}>
                <Plus /> Aggiungi libro
              </Button>
            </div>
          }
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca per titolo o autore"
              className="pl-9"
            />
          </div>
          <Select value={stato} onValueChange={(v) => setStato(v as Stato | "ALL")}>
            <SelectTrigger className="sm:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tutti gli stati</SelectItem>
              {STATI.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
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
          <div className="grid gap-3">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <GripVertical className="size-3.5" />
              {canReorder
                ? "Trascina la maniglia a destra per cambiare la priorità: l'ordine si salva subito."
                : "Togli ricerca e filtro per riordinare i libri."}
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
