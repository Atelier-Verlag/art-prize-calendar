-- =====================
-- FIX art_prizes SELECT
-- =====================
DROP POLICY IF EXISTS "Art prizes are publicly readable" ON public.art_prizes;

CREATE POLICY "Anon can read art_prizes"
ON public.art_prizes
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Authenticated can read art_prizes"
ON public.art_prizes
FOR SELECT
TO authenticated
USING (true);

-- =====================
-- FIX site_content SELECT
-- =====================
DROP POLICY IF EXISTS "Anyone can read site_content" ON public.site_content;

CREATE POLICY "Anon can read site_content"
ON public.site_content
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Authenticated can read site_content"
ON public.site_content
FOR SELECT
TO authenticated
USING (true);

-- =====================
-- FIX scraper_logs policies (service role bypasses RLS anyway, so remove redundant permissive policies)
-- =====================
DROP POLICY IF EXISTS "Service role can insert scraper_logs" ON public.scraper_logs;
DROP POLICY IF EXISTS "Service role can read scraper_logs" ON public.scraper_logs;

-- =====================
-- FIX seminar_waitlist INSERT (add validation instead of bare 'true')
-- =====================
DROP POLICY IF EXISTS "Anyone can insert into seminar_waitlist" ON public.seminar_waitlist;

CREATE POLICY "Anon can insert into seminar_waitlist"
ON public.seminar_waitlist
FOR INSERT
TO anon
WITH CHECK (email IS NOT NULL AND email <> '');

CREATE POLICY "Authenticated can insert into seminar_waitlist"
ON public.seminar_waitlist
FOR INSERT
TO authenticated
WITH CHECK (email IS NOT NULL AND email <> '');