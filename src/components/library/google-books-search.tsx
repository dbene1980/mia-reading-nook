import { BookOpen, Loader2, Search } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchGoogleBooks, type GoogleBookResult } from "@/lib/google-books";

interface GoogleBooksSearchProps {
  onPick: (result: GoogleBookResult) => void;
}

export function GoogleBooksSearch({ onPick }: GoogleBooksSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GoogleBookResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function run() {
    const q = query.trim();
    if (!q) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    setPickedId(null);
    try {
      setResults(await searchGoogleBooks(q, ctrl.signal));
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setResults(null);
      setError(e instanceof Error ? e.message : "Ricerca non riuscita.");
    } finally {
      if (abortRef.current === ctrl) setLoading(false);
    }
  }

  return (
    <div className="grid gap-3 rounded-lg border border-border bg-muted/40 p-3">
      <div className="flex gap-2">
        <Input
          aria-label="Cerca su Google Books"
          placeholder="Cerca un titolo su Google Books…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void run();
            }
          }}
        />
        <Button type="button" variant="secondary" onClick={() => void run()} disabled={loading || !query.trim()}>
          {loading ? <Loader2 className="animate-spin" /> : <Search />} Cerca
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {results && results.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground">Nessun risultato trovato.</p>
      )}

      {results && results.length > 0 && (
        <ul className="grid gap-1.5">
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => {
                  setPickedId(r.id);
                  onPick(r);
                }}
                className={`flex w-full items-center gap-3 rounded-md border p-2 text-left transition-colors hover:bg-accent ${
                  pickedId === r.id ? "border-primary bg-accent" : "border-transparent"
                }`}
              >
                {r.copertina_url ? (
                  <img
                    src={r.copertina_url}
                    alt=""
                    loading="lazy"
                    className="h-14 w-10 shrink-0 rounded-sm object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground">
                    <BookOpen className="size-4" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-medium leading-snug">{r.titolo}</p>
                  <p className="truncate text-xs text-muted-foreground">{r.autore ?? "Autore sconosciuto"}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
