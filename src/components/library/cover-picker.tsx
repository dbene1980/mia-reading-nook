import { ExternalLink, ImageOff, Loader2, Sparkles } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { googleImagesCoverUrl, rankMatches, searchAppleBooks } from "@/lib/apple-books";
import { searchCovers } from "@/lib/open-library";
import { cn } from "@/lib/utils";

interface CoverPickerProps {
  titolo: string;
  autore: string;
  value: string;
  onChange: (url: string) => void;
  /** Called when a found cover is clicked (e.g. to save it right away). */
  onPick?: (url: string) => void;
}

interface Candidate {
  url: string;
  label: string;
  source: "Apple Books" | "Open Library";
}

/** Apple Books covers first (better for Italian editions), then Open Library. */
async function findCovers(titolo: string, autore: string, signal: AbortSignal): Promise<Candidate[]> {
  const [apple, ol] = await Promise.allSettled([
    searchAppleBooks(titolo, autore, signal),
    searchCovers(titolo, autore, signal),
  ]);
  if (apple.status === "rejected" && ol.status === "rejected") throw ol.reason;
  const out: Candidate[] = [];
  if (apple.status === "fulfilled") {
    for (const r of rankMatches(apple.value, titolo, autore)) {
      if (r.copertina_url) out.push({ url: r.copertina_url, label: r.titolo, source: "Apple Books" });
    }
  }
  if (ol.status === "fulfilled") {
    for (const c of ol.value) out.push({ url: c.url, label: c.titolo, source: "Open Library" });
  }
  const seen = new Set<string>();
  return out.filter((c) => !seen.has(c.url) && seen.add(c.url)).slice(0, 10);
}

export function CoverPicker({ titolo, autore, value, onChange, onPick }: CoverPickerProps) {
  const [results, setResults] = useState<Candidate[] | null>(null);
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
      setResults(await findCovers(titolo, autore, ctrl.signal));
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
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1 sm:flex-none"
              onClick={() => void run()}
              disabled={loading || !titolo.trim()}
            >
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles />} Cerca copertina
            </Button>
            {titolo.trim() ? (
              <Button asChild type="button" variant="ghost" size="sm" className="h-9 shrink-0">
                <a
                  href={googleImagesCoverUrl(titolo, autore)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Apri Google Immagini in una nuova scheda: copia l'indirizzo dell'immagine e incollalo qui"
                >
                  <ExternalLink /> Cerca su Google
                </a>
              </Button>
            ) : (
              <Button type="button" variant="ghost" size="sm" className="h-9 shrink-0" disabled>
                <ExternalLink /> Cerca su Google
              </Button>
            )}
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {results && results.length === 0 && !loading && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <ImageOff className="size-4" /> Nessuna copertina trovata. Prova "Cerca su Google" e incolla il
          link dell'immagine.
        </p>
      )}

      {results && results.length > 0 && (
        <div className="grid gap-2">
          <p className="text-xs text-muted-foreground">Copertine da Apple Books e Open Library: tocca per sceglierla</p>
          <div className="grid grid-cols-5 gap-2">
            {results.map((c) => {
              const selected = value === c.url;
              return (
                <button
                  key={c.url}
                  type="button"
                  aria-label={`Scegli copertina (${c.source}): ${c.label}`}
                  title={c.source}
                  aria-pressed={selected}
                  onClick={() => {
                    onChange(c.url);
                    onPick?.(c.url);
                  }}
                  className={cn(
                    "aspect-[2/3] overflow-hidden rounded-[3px] border-2 bg-muted transition-all hover:-translate-y-0.5",
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
