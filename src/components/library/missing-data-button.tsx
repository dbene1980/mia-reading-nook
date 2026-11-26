import { Loader2, WandSparkles } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  booksMissingData,
  fillMissingData,
  isRateLimitError,
  lookupMissingData,
  type EnrichProgress,
} from "@/lib/book-enrich";
import { cn } from "@/lib/utils";
import type { Book } from "@/lib/books";
import { useBookMutations } from "@/lib/books-data";

/** Pause between books: Apple Books allows roughly 20 searches a minute. */
const DELAY_MS = 3000;

/** Bulk "Completa dati mancanti": fills only empty author/description/pages/cover fields. */
export function MissingDataButton({ books, className }: { books: Book[]; className?: string }) {
  const { fillEmptyFields } = useBookMutations();
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<EnrichProgress | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const incompleteBooks = booksMissingData(books);
  const missing = incompleteBooks.length;

  async function start() {
    const todo = booksMissingData(books);
    if (todo.length === 0) {
      toast.info("Tutti i libri hanno già i dati completi");
      return;
    }
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setOpen(true);
    setRunning(true);
    const result = await fillMissingData(todo, {
      signal: ctrl.signal,
      find: (b, signal) => lookupMissingData(b, signal),
      save: (b, patch) => fillEmptyFields(b.id, patch),
      onProgress: setProgress,
      isRateLimit: isRateLimitError,
      delayMs: DELAY_MS,
      retryDelayMs: 60_000,
    });
    setRunning(false);
    if (!ctrl.signal.aborted) {
      toast.success(`Completati ${result.completed} libri su ${result.total} (${result.fields} campi)`);
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  const pct = progress && progress.total ? Math.round((progress.processed / progress.total) * 100) : 0;
  const minutes = Math.max(1, Math.ceil((missing * DELAY_MS) / 60_000));

  return (
    <>
      <Button
        variant="outline"
        onClick={() => void start()}
        disabled={running}
        className={cn("h-auto min-h-9 py-2 whitespace-normal text-center min-[480px]:whitespace-nowrap", className)}
      >
        {running ? <Loader2 className="animate-spin" /> : <WandSparkles />}
        Completa dati mancanti
        {missing > 0 && <span className="tabular-nums text-muted-foreground">({missing})</span>}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) stop();
          setOpen(o);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-semibold tracking-wide">
              Completa dati mancanti
            </DialogTitle>
            <DialogDescription>
              Cerco su Apple Books e Open Library autore, descrizione, pagine e copertina, e compilo solo i
              campi vuoti: quello che hai già scritto non viene toccato. Tieni aperta la pagina (circa{" "}
              {minutes} min).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <Progress value={pct} aria-label="Avanzamento" />
            <p className="text-sm tabular-nums">
              {progress?.processed ?? 0} di {progress?.total ?? missing} libri · {pct}%
            </p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-[var(--radius)] border-[1.5px] border-line bg-background/40 p-2">
                <p className="font-display text-xl text-success tabular-nums">{progress?.completed ?? 0}</p>
                completati
              </div>
              <div className="rounded-[var(--radius)] border-[1.5px] border-line bg-background/40 p-2">
                <p className="font-display text-xl tabular-nums">{progress?.notFound ?? 0}</p>
                non trovati
              </div>
              <div className="rounded-[var(--radius)] border-[1.5px] border-line bg-background/40 p-2">
                <p className="font-display text-xl text-destructive tabular-nums">{progress?.failed ?? 0}</p>
                errori
              </div>
            </div>
            {progress?.current && (
              <p className="truncate text-xs text-muted-foreground">Sto cercando: {progress.current}</p>
            )}
          </div>

          <DialogFooter>
            {running ? (
              <Button variant="outline" onClick={stop}>
                Interrompi
              </Button>
            ) : (
              <Button onClick={() => setOpen(false)}>Chiudi</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
