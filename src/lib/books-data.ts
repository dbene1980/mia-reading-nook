/** Data access for the books table (user's own database; RLS limits rows to the signed-in user). */
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { BookFormValues } from "@/components/library/book-form-dialog";
import { supabase } from "@/integrations/supabase/client";

import type { Book } from "./books";

const PAGE = 1000;

export const booksQueryOptions = queryOptions({
  queryKey: ["books"],
  queryFn: async (): Promise<Book[]> => {
    // The API returns at most 1000 rows per request: page through everything.
    const all: Book[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("created_at", { ascending: false })
        .order("id")
        .range(from, from + PAGE - 1);
      if (error) throw error;
      all.push(...((data ?? []) as Book[]));
      if (!data || data.length < PAGE) break;
    }
    return all;
  },
});

export function useBooks(): { books: Book[]; isLoading: boolean } {
  const q = useQuery(booksQueryOptions);
  return { books: q.data ?? [], isLoading: q.isLoading };
}

export type BookPatch = Partial<BookFormValues> & { letto?: boolean };

export function useBookMutations() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: booksQueryOptions.queryKey });

  const create = useMutation({
    mutationFn: async (values: BookFormValues) => {
      const { error } = await supabase.from("books").insert({ ...values, letto: false });
      if (error) throw error;
    },
    onSuccess: refresh,
  });
  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: BookPatch }) => {
      const { error } = await supabase.from("books").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("books").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  /** Saves only the cover and patches the cached list in place (no full refetch: used in bulk). */
  async function setCover(id: string, url: string | null) {
    const { error } = await supabase.from("books").update({ copertina_url: url }).eq("id", id);
    if (error) throw error;
    qc.setQueryData<Book[]>(booksQueryOptions.queryKey, (prev) =>
      prev?.map((b) => (b.id === id ? { ...b, copertina_url: url } : b)),
    );
  }

  return {
    setCover,
    createBook: (values: BookFormValues) => create.mutateAsync(values),
    updateBook: (id: string, patch: BookPatch) => update.mutateAsync({ id, patch }),
    deleteBook: (id: string) => remove.mutateAsync(id),
  };
}
