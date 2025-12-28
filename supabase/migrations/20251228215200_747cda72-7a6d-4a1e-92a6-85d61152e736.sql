-- Tabelle für Scraper-Logs
CREATE TABLE public.scraper_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'running')),
  message TEXT NOT NULL,
  items_found INTEGER DEFAULT 0
);

-- RLS aktivieren
ALTER TABLE public.scraper_logs ENABLE ROW LEVEL SECURITY;

-- Admins können alles lesen
CREATE POLICY "Admins can read scraper_logs"
ON public.scraper_logs
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Admins können einfügen
CREATE POLICY "Admins can insert scraper_logs"
ON public.scraper_logs
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- Service-Role kann auch einfügen (für Edge Functions)
CREATE POLICY "Service role can insert scraper_logs"
ON public.scraper_logs
FOR INSERT
WITH CHECK (true);

-- Service-Role kann lesen
CREATE POLICY "Service role can read scraper_logs"
ON public.scraper_logs
FOR SELECT
USING (true);