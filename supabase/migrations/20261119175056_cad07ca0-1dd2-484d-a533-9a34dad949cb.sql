CREATE TABLE public.books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  titolo text NOT NULL CHECK (length(btrim(titolo)) > 0),
  autore text,
  stato text CHECK (stato IN ('SCARICATO', 'DA SCARICARE', 'DA COMPRARE', 'NON TROVATO')),
  descrizione text,
  note text,
  letto boolean NOT NULL DEFAULT false,
  data_fine_libro timestamptz,
  rating integer CHECK (rating BETWEEN 1 AND 5),
  tipo text CHECK (tipo IN ('LIBRO', 'EBOOK', 'AUDIOLIBRO', 'FUMETTO')),
  copertina_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.books TO authenticated;
GRANT ALL ON public.books TO service_role;

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own books" ON public.books
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users add own books" ON public.books
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own books" ON public.books
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own books" ON public.books
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX books_user_letto_idx ON public.books (user_id, letto);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();