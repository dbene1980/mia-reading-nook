import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { BookFormDialog } from "@/components/library/book-form-dialog";
import { EmptyState } from "@/components/library/empty-state";
import { MissingCoversButton } from "@/components/library/missing-covers-button";
import { PageHeader } from "@/components/library/page-header";
import { ReadBookRow } from "@/components/library/read-book-row";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TIPI, TIPO_LABEL, filterRead, type Tipo } from "@/lib/books";
import { useBooks } from "@/lib/books-data";
import { useBookActions } from "@/lib/use-book-actions";

export const Route = createFileRoute("/_authenticated/libri-letti")({
  head: () => ({
    meta: [
      { title: "Libri letti · La mia libreria" },
      { name: "description", content: "Tutti i libri che hai finito, con voto, tipo e note." },
      { property: "og:title", content: "Libri letti · La mia libreria" },
      { property: "og:description", content: "Tutti i libri che hai finito, con voto, tipo e note." },
    ],
  }),
  component: ReadPage,
});

function ReadPage() {
  const { books, isLoading } = useBooks();
  const actions = useBookActions();
  const [query, setQuery] = useState("");
  const [tipo, setTipo] = useState<Tipo | "ALL">("ALL");
  const [rating, setRating] = useState<string>("ALL");
  const list = useMemo(
    () => filterRead(books, { query, tipo, rating: rating === "ALL" ? "ALL" : Number(rating) }),
    [books, query, tipo, rating],
  );
  const scope = useMemo(() => books.filter((b) => b.letto), [books]);
  const total = scope.length;

  return (
    <AppShell>
      <div className="grid gap-8">
        <PageHeader
          eyebrow={`${total} completati`}
          title="Libri letti"
          actions={<MissingCoversButton books={scope} />}
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
          <Select value={tipo} onValueChange={(v) => setTipo(v as Tipo | "ALL")}>
            <SelectTrigger className="sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tutti i tipi</SelectItem>
              {TIPI.map((t) => (
                <SelectItem key={t} value={t}>
                  {TIPO_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={rating} onValueChange={setRating}>
            <SelectTrigger className="sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Ogni voto</SelectItem>
              {[5, 4, 3, 2, 1].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {"★".repeat(n)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState title={total === 0 ? "Ancora nessun libro letto" : "Nessun risultato"}>
            {total === 0
              ? "Quando segni un libro come letto, lo trovi qui."
              : "Prova a cambiare la ricerca o i filtri."}
          </EmptyState>
        ) : (
          <div className="grid gap-3">
            {list.map((b, i) => (
              <ReadBookRow
                key={b.id}
                book={b}
                index={i}
                onEdit={actions.openEdit}
                onUnread={actions.markUnread}
              />
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
      />
    </AppShell>
  );
}
