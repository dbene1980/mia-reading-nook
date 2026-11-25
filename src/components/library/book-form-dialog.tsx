import { CheckCircle2, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  STATI,
  TIPI,
  TIPO_LABEL,
  toLocalInputValue,
  type Book,
  type Stato,
  type Tipo,
} from "@/lib/books";

import { BookCover } from "./book-cover";
import { CoverPicker } from "./cover-picker";
import { GoogleBooksSearch } from "./google-books-search";
import { StarRating } from "./star-rating";

export interface BookFormValues {
  titolo: string;
  autore: string | null;
  stato: Stato | null;
  tipo: Tipo | null;
  descrizione: string | null;
  note: string | null;
  copertina_url: string | null;
  pagine: number | null;
  rating: number | null;
  data_fine_libro: string | null;
}

interface BookFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = new book */
  book: Book | null;
  onSave: (values: BookFormValues) => Promise<void> | void;
  onDelete?: (book: Book) => Promise<void> | void;
  onMarkRead?: (book: Book) => void;
  /** Save a cover picked from the automatic search right away (existing books only). */
  onSaveCover?: (book: Book, url: string) => Promise<void> | void;
}

const NONE = "__none__";

function emptyToNull(s: string) {
  const t = s.trim();
  return t ? t : null;
}

function parsePagine(s: string) {
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function BookFormDialog({
  open,
  onOpenChange,
  book,
  onSave,
  onDelete,
  onMarkRead,
  onSaveCover,
}: BookFormDialogProps) {
  const [titolo, setTitolo] = useState("");
  const [autore, setAutore] = useState("");
  const [stato, setStato] = useState<string>(NONE);
  const [tipo, setTipo] = useState<string>(NONE);
  const [descrizione, setDescrizione] = useState("");
  const [note, setNote] = useState("");
  const [cover, setCover] = useState("");
  const [pagine, setPagine] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [dataFine, setDataFine] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitolo(book?.titolo ?? "");
    setAutore(book?.autore ?? "");
    setStato(book?.stato ?? NONE);
    setTipo(book?.tipo ?? NONE);
    setDescrizione(book?.descrizione ?? "");
    setNote(book?.note ?? "");
    setCover(book?.copertina_url ?? "");
    setPagine(book?.pagine ? String(book.pagine) : "");
    setRating(book?.rating ?? null);
    setDataFine(book?.data_fine_libro ? toLocalInputValue(new Date(book.data_fine_libro)) : "");
  }, [open, book]);

  const isRead = Boolean(book?.letto);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!titolo.trim()) return;
    setSaving(true);
    try {
      await onSave({
        titolo: titolo.trim(),
        autore: emptyToNull(autore),
        stato: stato === NONE ? null : (stato as Stato),
        tipo: tipo === NONE ? null : (tipo as Tipo),
        descrizione: emptyToNull(descrizione),
        note: emptyToNull(note),
        copertina_url: emptyToNull(cover),
        pagine: parsePagine(pagine),
        rating: isRead ? rating : (book?.rating ?? null),
        data_fine_libro: isRead
          ? dataFine
            ? new Date(dataFine).toISOString()
            : null
          : (book?.data_fine_libro ?? null),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={submit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-semibold tracking-wide">
              {book ? "Dettagli libro" : "Nuovo libro"}
            </DialogTitle>
            <DialogDescription>
              {book ? "Modifica le informazioni e salva." : "Aggiungi un libro alla lista da leggere."}
            </DialogDescription>
          </DialogHeader>

          {!book && (
            <GoogleBooksSearch
              onPick={(r) => {
                setTitolo(r.titolo);
                setAutore(r.autore ?? "");
                setDescrizione(r.descrizione ?? "");
                setCover(r.copertina_url ?? "");
              }}
            />
          )}

          {book && !isRead && onMarkRead && (
            <Button
              type="button"
              variant="success"
              size="lg"
              className="w-full"
              onClick={() => onMarkRead(book)}
            >
              <CheckCircle2 /> Segna come letto
            </Button>
          )}

          <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-[100px_minmax(0,1fr)] sm:grid-cols-[128px_minmax(0,1fr)] sm:gap-5">
            <BookCover
              url={emptyToNull(cover)}
              titolo={titolo || "Senza titolo"}
              autore={emptyToNull(autore)}
              className="mx-auto w-24 min-[480px]:mx-0 min-[480px]:w-full self-start"
              read={isRead}
            />
            <div className="grid min-w-0 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="titolo">Titolo *</Label>
                <Input
                  id="titolo"
                  required
                  value={titolo}
                  onChange={(e) => setTitolo(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="autore">Autore</Label>
                <Input id="autore" value={autore} onChange={(e) => setAutore(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Stato</Label>
                  <Select value={stato} onValueChange={setStato}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>—</SelectItem>
                      {STATI.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Tipo</Label>
                  <Select value={tipo} onValueChange={setTipo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>—</SelectItem>
                      {TIPI.map((t) => (
                        <SelectItem key={t} value={t}>
                          {TIPO_LABEL[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2 sm:max-w-[calc(50%-0.375rem)]">
                <Label htmlFor="pagine">Numero di pagine</Label>
                <Input
                  id="pagine"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  value={pagine}
                  onChange={(e) => setPagine(e.target.value)}
                  placeholder="Es. 320"
                />
              </div>
            </div>
          </div>

          {isRead && (
            <div className="grid gap-4 rounded-[var(--radius)] border-[1.5px] border-line bg-background/40 p-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="data_fine_edit">Data fine lettura</Label>
                <Input
                  id="data_fine_edit"
                  type="datetime-local"
                  value={dataFine}
                  onChange={(e) => setDataFine(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Voto</Label>
                <StarRating value={rating} onChange={setRating} size="md" />
              </div>
            </div>
          )}

          <CoverPicker
            titolo={titolo}
            autore={autore}
            value={cover}
            onChange={setCover}
            {...(book && onSaveCover ? { onPick: (url: string) => void onSaveCover(book, url) } : {})}
          />
          <div className="grid gap-2">
            <Label htmlFor="descrizione">Descrizione</Label>
            <Textarea
              id="descrizione"
              rows={3}
              value={descrizione}
              onChange={(e) => setDescrizione(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="note">Note</Label>
            <Textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          <DialogFooter className="flex-col gap-2 min-[480px]:flex-row min-[480px]:justify-between">
            {book && onDelete ? (
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-center text-destructive hover:text-destructive min-[480px]:w-auto"
                onClick={() => {
                  if (confirm(`Eliminare "${book.titolo}"?`)) onDelete(book);
                }}
              >
                <Trash2 /> Elimina
              </Button>
            ) : (
              <span className="hidden min-[480px]:inline" />
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Annulla
              </Button>
              <Button type="submit" disabled={saving || !titolo.trim()}>
                {book ? "Salva modifiche" : "Aggiungi libro"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
