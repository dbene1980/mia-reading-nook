import { createFileRoute } from "@tanstack/react-router";
import { BookPlus, Eye, EyeOff, Loader2, Sparkles, X } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

import { OrnamentRule } from "@/components/brand/ornaments";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/library/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBooks } from "@/lib/books-data";
import { useBookMutations } from "@/lib/books-data";
import {
  type AiBook,
  fetchCover,
  fetchGeminiRecommendations,
  getGeminiKey,
  GEMINI_KEY_STORAGE,
  setGeminiKey,
} from "@/lib/gemini";
import { nextPosition } from "@/lib/books";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/consigli-ai")({
  head: () => ({
    meta: [
      { title: "Consigli AI · La Libreria di Daniele" },
      { name: "description", content: "Consigli di lettura personalizzati generati da Gemini AI." },
    ],
  }),
  component: ConsigliAiPage,
});

/* ---------- Card for one recommended book ---------- */

interface RecommendedCard extends AiBook {
  coverUrl: string | null;
  coverLoading: boolean;
  added: boolean;
  adding: boolean;
}

function BookRecommendCard({
  card,
  onAdd,
}: {
  card: RecommendedCard;
  onAdd: (card: RecommendedCard) => void;
}) {
  return (
    <div className="ink-card flex min-w-0 flex-col gap-0 overflow-hidden shadow-card">
      {/* Cover */}
      <div className="relative h-44 w-full overflow-hidden bg-zinc-900">
        {card.coverLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="size-6 animate-spin text-gold/60" />
          </div>
        ) : card.coverUrl ? (
          <img
            src={card.coverUrl}
            alt={`Copertina di ${card.titolo}`}
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-xs text-muted-foreground">Nessuna copertina</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <h3 className="break-words font-display text-base font-semibold leading-snug">
            {card.titolo}
          </h3>
          <p className="mt-0.5 text-xs text-gold">{card.autore}</p>
        </div>

        <p className="line-clamp-4 text-xs leading-relaxed text-muted-foreground">
          {card.descrizione}
        </p>

        <div className="rounded-sm border border-primary/30 bg-primary/10 px-3 py-2">
          <p className="text-[11px] italic leading-relaxed text-foreground/80">
            <span className="not-italic font-semibold text-gold">✦ Perché ti piacerà: </span>
            {card.perche_ti_piacera}
          </p>
        </div>

        <Button
          size="sm"
          variant={card.added ? "outline" : "default"}
          className={cn(
            "mt-auto w-full",
            card.added && "border-gold/60 text-gold cursor-default",
          )}
          disabled={card.added || card.adding}
          onClick={() => onAdd(card)}
        >
          {card.adding ? (
            <Loader2 className="size-4 animate-spin" />
          ) : card.added ? (
            "✓ Aggiunto"
          ) : (
            <>
              <BookPlus className="size-4" /> + Aggiungi a Da leggere
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

/* ---------- API key panel ---------- */

function ApiKeyPanel({ onSaved }: { onSaved: () => void }) {
  const [key, setKey] = useState(getGeminiKey);
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(!getGeminiKey());

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
      >
        ⚙ Modifica Gemini API Key
      </button>
    );
  }

  return (
    <div className="ink-card flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold uppercase tracking-widest text-gold">
          Gemini API Key
        </Label>
        {getGeminiKey() && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        La chiave viene salvata solo nel tuo browser (localStorage) e non viene mai inviata a
        GitHub.{" "}
        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold underline underline-offset-2"
        >
          Ottieni una chiave gratuita →
        </a>
      </p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type={show ? "text" : "password"}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="AIzaSy..."
            className="pr-9 font-mono text-xs"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={show ? "Nascondi chiave" : "Mostra chiave"}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setGeminiKey(key);
            setOpen(false);
            onSaved();
          }}
        >
          Salva
        </Button>
      </div>
    </div>
  );
}

/* ---------- Main page ---------- */

function ConsigliAiPage() {
  const { books } = useBooks();
  const { create } = useBookMutations();

  const readBooks = useMemo(
    () =>
      books
        .filter((b) => b.letto)
        .map((b) => ({
          titolo: b.titolo,
          autore: b.autore ?? "",
          rating: b.rating,
          note: b.note,
        })),
    [books],
  );

  const toReadTitles = useMemo(
    () => books.filter((b) => !b.letto).map((b) => b.titolo),
    [books],
  );

  const [mood, setMood] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<RecommendedCard[]>([]);
  const [keyVersion, setKeyVersion] = useState(0); // forces re-render after key save

  // keep latest books ref for adding
  const booksRef = useRef(books);
  booksRef.current = books;

  const hasKey = !!getGeminiKey();

  const generate = useCallback(async () => {
    const apiKey = getGeminiKey();
    if (!apiKey) {
      setError("Inserisci una Gemini API Key per continuare.");
      return;
    }
    setLoading(true);
    setError(null);
    setCards([]);

    let aiBooks: AiBook[];
    try {
      aiBooks = await fetchGeminiRecommendations(readBooks, toReadTitles, mood, apiKey);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
      return;
    }

    // Initialise cards (covers load in parallel after)
    const initial: RecommendedCard[] = aiBooks.map((b) => ({
      ...b,
      coverUrl: null,
      coverLoading: true,
      added: false,
      adding: false,
    }));
    setCards(initial);
    setLoading(false);

    // Fetch covers in parallel
    aiBooks.forEach(async (b, i) => {
      const url = await fetchCover(b.titolo, b.autore);
      setCards((prev) =>
        prev.map((c, j) => (j === i ? { ...c, coverUrl: url, coverLoading: false } : c)),
      );
    });
  }, [readBooks, toReadTitles, mood]);

  const handleAdd = useCallback(
    async (card: RecommendedCard) => {
      setCards((prev) =>
        prev.map((c) => (c.titolo === card.titolo ? { ...c, adding: true } : c)),
      );
      try {
        await create.mutateAsync({
          titolo: card.titolo,
          autore: card.autore,
          descrizione: card.descrizione,
          copertina_url: card.coverUrl ?? null,
          stato: "DA COMPRARE",
          tipo: null,
          note: null,
          rating: null,
          pagine: null,
          data_fine_libro: null,
        });
        setCards((prev) =>
          prev.map((c) =>
            c.titolo === card.titolo ? { ...c, adding: false, added: true } : c,
          ),
        );
      } catch (e) {
        setCards((prev) =>
          prev.map((c) => (c.titolo === card.titolo ? { ...c, adding: false } : c)),
        );
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [create],
  );

  return (
    <AppShell>
      <div className="grid grid-cols-1 min-w-0 max-w-full gap-6 sm:gap-10">
        <PageHeader
          eyebrow="Powered by Gemini"
          title="Consigli AI"
          icon={<Sparkles className="size-5 text-gold" />}
        />

        <div className="grid grid-cols-1 gap-4">
          {/* API Key */}
          <ApiKeyPanel
            onSaved={() => setKeyVersion((v) => v + 1)}
          />

          {/* Mood input */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Umore o genere del momento{" "}
              <span className="normal-case tracking-normal text-muted-foreground/60">(opzionale)</span>
            </Label>
            <Textarea
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              placeholder="Es. voglio qualcosa di oscuro e psicologico, oppure un fantasy epico..."
              rows={2}
              className="resize-none text-sm"
            />
          </div>

          {/* Generate button */}
          <Button
            size="lg"
            onClick={generate}
            disabled={loading || (!hasKey && keyVersion >= 0)}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="size-5 animate-spin" /> Generazione in corso…
              </>
            ) : (
              <>
                <Sparkles className="size-5" /> Genera consigli per me
              </>
            )}
          </Button>

          {error && (
            <div className="rounded-sm border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        {cards.length > 0 && (
          <>
            <OrnamentRule />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((card) => (
                <BookRecommendCard
                  key={card.titolo + card.autore}
                  card={card}
                  onAdd={handleAdd}
                />
              ))}
            </div>
          </>
        )}

        {/* Empty state before first generation */}
        {cards.length === 0 && !loading && !error && (
          <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
            <Sparkles className="size-10 opacity-30" />
            <p className="text-sm">
              {readBooks.length === 0
                ? "Aggiungi qualche libro letto con un voto per ricevere consigli personalizzati."
                : "Premi «Genera consigli per me» per scoprire nuovi libri."}
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
