import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TIPI, TIPO_LABEL, toLocalInputValue, type Book, type Tipo } from "@/lib/books";
import { cn } from "@/lib/utils";

import { StarRating } from "./star-rating";

export interface MarkReadValues {
  data_fine_libro: string;
  rating: number | null;
  tipo: Tipo | null;
  note: string | null;
}

interface MarkReadDialogProps {
  book: Book | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (values: MarkReadValues) => Promise<void> | void;
}

export function MarkReadDialog({ book, open, onOpenChange, onConfirm }: MarkReadDialogProps) {
  const [date, setDate] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [tipo, setTipo] = useState<Tipo | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && book) {
      setDate(toLocalInputValue(new Date()));
      setRating(book.rating);
      setTipo(book.tipo);
      setNote(book.note ?? "");
    }
  }, [open, book]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onConfirm({
        data_fine_libro: new Date(date).toISOString(),
        rating,
        tipo,
        note: note.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-semibold tracking-wide">Libro terminato</DialogTitle>
            <DialogDescription className="line-clamp-2">{book?.titolo}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="data_fine">Data fine lettura</Label>
            <Input
              id="data_fine"
              type="datetime-local"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Voto</Label>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>

          <div className="grid gap-2">
            <Label>Tipo</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TIPI.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  aria-pressed={tipo === t}
                  className={cn(
                    "rounded-xl border px-2 py-2 text-sm transition-colors",
                    tipo === t
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border text-muted-foreground hover:bg-accent",
                  )}
                >
                  {TIPO_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="note_letto">Note</Label>
            <Textarea
              id="note_letto"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Cosa ti è rimasto di questo libro?"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" variant="success" disabled={saving}>
              <CheckCircle2 /> Sposta in Libri letti
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
