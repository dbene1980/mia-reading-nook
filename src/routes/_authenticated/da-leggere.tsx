import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { BookCard } from "@/components/library/book-card";
import { BookFormDialog } from "@/components/library/book-form-dialog";
import { EmptyState } from "@/components/library/empty-state";
import { MissingCoversButton } from "@/components/library/missing-covers-button";
import { MarkReadDialog } from "@/components/library/mark-read-dialog";
import { PageHeader } from "@/components/library/page-header";
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
      { title: "Da leggere · La mia libreria" },
      { name: "description", content: "I libri che ti aspettano, con ricerca e filtri per stato." },
      { property: "og:title", content: "Da leggere · La mia libreria" },
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

  return (
    <AppShell>
      <div className="grid gap-8">
        <PageHeader
          eyebrow={`${total} in attesa`}
          title="Da leggere"
          actions={
            <div className="flex flex-wrap gap-2">
              <MissingCoversButton books={scope} />
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
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState title={total === 0 ? "Nessun libro in lista" : "Nessun risultato"}>
            {total === 0
              ? "Aggiungi il primo libro che vuoi leggere."
              : "Prova a cambiare la ricerca o il filtro."}
          </EmptyState>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {list.map((b, i) => (
              <BookCard key={b.id} book={b} index={i} onOpen={actions.openEdit} />
            ))}
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
