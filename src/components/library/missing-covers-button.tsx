import { ImageDown, Loader2 } from "lucide-react";
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
import type { Book } from "@/lib/books";
import { useBookMutations } from "@/lib/books-data";
import { booksMissingCover, fetchMissingCovers, type CoverFetchProgress } from "@/lib/cover-fetch";
import { OpenLibraryRateLimitError, searchCovers } from "@/lib/open-library";

/** Scans the given books without a cover and saves the first Open Library match for each. */
export function MissingCoversButton({ books }: { books: Book[] }) {
  const { setCover } = useBookMutations();
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<CoverFetchProgress | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const missing = booksMissingCover(books).length;

  async function start() {
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setOpen(true);
    setRunning(true);
    const result = await fetchMissingCovers(books, {
      signal: ctrl.signal,
      find: async (b, signal) => (await searchCovers(b.titolo, b.autore, signal))[0]?.url ?? null,
      save: (b, url) => setCover(b.id, url),
      onProgress: setProgress,
      isRateLimit: (e) => e instanceof OpenLibraryRateLimitError,
    });
    setRunning(false);
    if (!ctrl.signal.aborted) toast.success(`Copertine trovate: ${result.found} su ${result.total}`);
  }

  function stop() {
    abortRef.current?.abort();
  }

  const pct = progress && progress.total ? Math.round((progress.processed / progress.total) * 100) : 0;

  return (
    <>
      <Button variant="outline" onClick={() => void start()} disabled={running || missing === 0}>
        {running ? <Loader2 className="animate-spin" /> : <ImageDown />}
        Recupera copertine mancanti
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
            <DialogTitle className="font-display text-2xl font-semibold tracking-wide">Recupero copertine</DialogTitle>
            <DialogDescription>
              Cerco su Open Library la prima copertina per titolo e autore e la salvo nella tua libreria.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <Progress value={pct} aria-label="Avanzamento" />
            <p className="text-sm tabular-nums">
              {progress?.processed ?? 0} di {progress?.total ?? missing} libri · {pct}%
            </p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-[var(--radius)] border-[1.5px] border-line bg-background/40 p-2">
                <p className="font-display text-xl text-success tabular-nums">{progress?.found ?? 0}</p>
                trovate
              </div>
              <div className="rounded-[var(--radius)] border-[1.5px] border-line bg-background/40 p-2">
                <p className="font-display text-xl tabular-nums">{progress?.notFound ?? 0}</p>
                non trovate
              </div>
              <div className="rounded-[var(--radius)] border-[1.5px] border-line bg-background/40 p-2">
                <p className="font-display text-xl text-destructive tabular-nums">{progress?.failed ?? 0}</p>
                errori
              </div>
            </div>
            <p className="min-h-5 truncate text-xs text-muted-foreground">
              {running
                ? progress?.current
                  ? `Sto cercando: ${progress.current}`
                  : "Avvio…"
                : abortRef.current?.signal.aborted
                  ? "Interrotto. Puoi riprendere quando vuoi: ripartirà dai libri ancora senza copertina."
                  : "Finito."}
            </p>
          </div>

          <DialogFooter>
            {running ? (
              <Button variant="ghost" onClick={stop}>
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
