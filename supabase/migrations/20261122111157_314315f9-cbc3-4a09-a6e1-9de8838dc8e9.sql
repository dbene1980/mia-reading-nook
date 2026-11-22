ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS posizione integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pagine integer,
  ADD COLUMN IF NOT EXISTS copertina_url text;

ALTER TABLE public.books DROP CONSTRAINT IF EXISTS books_stato_check;
ALTER TABLE public.books ADD CONSTRAINT books_stato_check
  CHECK (stato IN ('SCARICATO', 'COMPRATO', 'DA SCARICARE', 'DA COMPRARE', 'NON TROVATO'));

ALTER TABLE public.books DROP CONSTRAINT IF EXISTS books_pagine_check;
ALTER TABLE public.books ADD CONSTRAINT books_pagine_check CHECK (pagine IS NULL OR pagine > 0);

-- Keep the current "Da leggere" order (newest first) as the starting priority.
UPDATE public.books b
SET posizione = r.rn
FROM (
  SELECT id, row_number() OVER (PARTITION BY user_id ORDER BY created_at DESC, id) AS rn
  FROM public.books
  WHERE letto = false
) r
WHERE b.id = r.id;

CREATE INDEX IF NOT EXISTS books_user_posizione_idx ON public.books (user_id, posizione);