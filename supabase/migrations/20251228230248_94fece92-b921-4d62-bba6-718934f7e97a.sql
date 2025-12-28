-- Add new categories to the art_category enum
ALTER TYPE public.art_category ADD VALUE IF NOT EXISTS 'Kunstpreis';
ALTER TYPE public.art_category ADD VALUE IF NOT EXISTS 'Wettbewerb';