import { useState } from "react";
import { toast } from "sonner";

import type { BookFormValues } from "@/components/library/book-form-dialog";
import type { MarkReadValues } from "@/components/library/mark-read-dialog";
import type { Book } from "./books";
import { useBookMutations } from "./books-data";

function errorMessage(e: unknown) {
  return e instanceof Error ? e.message : "Operazione non riuscita";
}

/** Dialog state + save handlers shared by the library pages. */
export function useBookActions() {
  const { createBook, updateBook, deleteBook, setCover } = useBookMutations();
  const [editing, setEditing] = useState<Book | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [marking, setMarking] = useState<Book | null>(null);

  return {
    editing,
    formOpen,
    marking,
    openNew: () => {
      setEditing(null);
      setFormOpen(true);
    },
    openEdit: (book: Book) => {
      setEditing(book);
      setFormOpen(true);
    },
    setFormOpen,
    startMarkRead: (book: Book) => setMarking(book),
    closeMarkRead: () => setMarking(null),
    async save(values: BookFormValues) {
      try {
        if (editing) await updateBook(editing.id, values);
        else await createBook(values);
        toast.success(editing ? "Modifiche salvate" : "Libro aggiunto");
        setFormOpen(false);
      } catch (e) {
        toast.error(errorMessage(e));
      }
    },
    async saveCover(book: Book, url: string) {
      try {
        await setCover(book.id, url);
        toast.success("Copertina salvata");
      } catch (e) {
        toast.error(errorMessage(e));
      }
    },
    async remove(book: Book) {
      try {
        await deleteBook(book.id);
        toast.success("Libro eliminato");
        setFormOpen(false);
      } catch (e) {
        toast.error(errorMessage(e));
      }
    },
    async confirmMarkRead(values: MarkReadValues) {
      if (!marking) return;
      try {
        await updateBook(marking.id, { ...values, letto: true });
        toast.success(`"${marking.titolo}" spostato in Libri letti`);
        setMarking(null);
        setFormOpen(false);
      } catch (e) {
        toast.error(errorMessage(e));
      }
    },
    async markUnread(book: Book) {
      try {
        await updateBook(book.id, { letto: false });
        toast.success(`"${book.titolo}" riportato in Da leggere`);
      } catch (e) {
        toast.error(errorMessage(e));
      }
    },
  };
}
