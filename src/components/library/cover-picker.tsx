import { ImageOff, Loader2, Sparkles } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { searchCovers, type CoverCandidate } from "@/lib/open-library";
import { cn } from "@/lib/utils";

interface CoverPickerProps {
  titolo: string;
  autore: string;
  value: string;
  onChange: (url: string) => void;
  /** Called when a found cover is clicked (e.g. to save it right away). */
  onPick?: (url: string) => void;
}

export function CoverPicker({ titolo, autore, value, onChange, onPick }: CoverPickerProps) {
  const [results, setResults] = useState<CoverCandidate[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function run() {
    if (!titolo.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      setResults(await searchCovers(titolo, autore, ctrl.signal));
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setResults(null);
      setError(e instanceof Error ? e.message : "Ricerca non riuscita.");
    } finally {
      if (abortRef.current === ctrl) setLoading(false);
    }
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        <Label htmlFor="copertina">Link copertina</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="copertina"
            type="url"
            placeholder="Incolla il link di un'immagine…"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-w-0 flex-1"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => void run()}
            disabled={loading || !titolo.trim()}
          >
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />} Cerca copertina
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {results && results.length === 0 && !loading && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <ImageOff className="size-4" /> Nessuna copertina trovata su Open Library.
        </p>
      )}

      {results && results.length > 0 && (
        <div className="grid gap-2">
          <p className="text-xs text-muted-foreground">Copertine da Open Library: tocca per sceglierla</p>
          <div className="grid grid-cols-5 gap-2">
            {results.map((c) => {
              const selected = value === c.url;
              return (
                <button
                  key={c.coverId}
                  type="button"
                  aria-label={`Scegli copertina: ${c.titolo}${c.autore ? `, ${c.autore}` : ""}`}
                  aria-pressed={selected}
                  onClick={() => {
                    onChange(c.url);
                    onPick?.(c.url);
                  }}
                  className={cn(
                    "aspect-[2/3] overflow-hidden rounded-md border-2 bg-muted transition-all hover:-translate-y-0.5",
                    selected ? "border-primary shadow-lift" : "border-transparent",
                  )}
                >
                  <img src={c.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
