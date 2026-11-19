/**
 * Data access for the books table.
 * TEMPORARY: the user's own database is not connected yet, so reads return an empty list
 * and writes fail with a clear message. Replace this module's internals once it is connected;
 * the exported hook signatures are what the pages rely on.
 */
import type { Book } from "./books";
import type { BookFormValues } from "@/components/library/book-form-dialog";

export const DATABASE_CONNECTED = false;

export class NotConnectedError extends Error {
  constructor() {
    super("Il database non è ancora collegato.");
  }
}

export function useBooks(): { books: Book[]; isLoading: boolean } {
  return { books: [], isLoading: false };
}

export type BookPatch = Partial<BookFormValues> & { letto?: boolean };

export function useBookMutations() {
  const fail = async (..._args: unknown[]): Promise<never> => {
    throw new NotConnectedError();
  };
  return {
    createBook: fail as (values: BookFormValues) => Promise<void>,
    updateBook: fail as (id: string, patch: BookPatch) => Promise<void>,
    deleteBook: fail as (id: string) => Promise<void>,
  };
}
