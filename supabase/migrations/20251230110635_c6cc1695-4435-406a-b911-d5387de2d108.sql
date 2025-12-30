-- Add currency column to art_prizes
ALTER TABLE public.art_prizes 
ADD COLUMN currency text NOT NULL DEFAULT 'EUR';