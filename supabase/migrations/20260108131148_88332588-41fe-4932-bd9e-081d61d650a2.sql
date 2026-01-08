-- Fix RLS for seminar_waitlist: Remove any public SELECT, keep admin-only
DROP POLICY IF EXISTS "Admins can read seminar_waitlist" ON public.seminar_waitlist;

CREATE POLICY "Admins can read seminar_waitlist"
ON public.seminar_waitlist
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Fix RLS for site_content: Restrict writes to admin only
DROP POLICY IF EXISTS "Allow authenticated all" ON public.site_content;

-- Keep public read for site content (legal pages need to be readable)
CREATE POLICY "Anyone can read site_content"
ON public.site_content
FOR SELECT
USING (true);

-- Only admins can insert/update/delete site content
CREATE POLICY "Admins can insert site_content"
ON public.site_content
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update site_content"
ON public.site_content
FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete site_content"
ON public.site_content
FOR DELETE
USING (public.is_admin(auth.uid()));