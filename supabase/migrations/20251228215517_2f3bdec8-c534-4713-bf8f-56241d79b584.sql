-- 1. Spalte is_archived zur art_prizes Tabelle hinzufügen (falls nicht vorhanden)
-- Hinweis: Die Spalte existiert bereits laut Schema, daher nur sicherstellen

-- 2. Tabelle für Scraper-Quellen erstellen
CREATE TABLE public.scraper_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true
);

-- RLS aktivieren
ALTER TABLE public.scraper_sources ENABLE ROW LEVEL SECURITY;

-- Admins können alles
CREATE POLICY "Admins can read scraper_sources"
ON public.scraper_sources
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert scraper_sources"
ON public.scraper_sources
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update scraper_sources"
ON public.scraper_sources
FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete scraper_sources"
ON public.scraper_sources
FOR DELETE
USING (public.is_admin(auth.uid()));