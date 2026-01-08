-- Fix seminars: Remove overly permissive "Allow authenticated all" and add proper admin-only policies
DROP POLICY IF EXISTS "Allow authenticated all" ON public.seminars;

CREATE POLICY "Admins can insert seminars"
ON public.seminars FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update seminars"
ON public.seminars FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete seminars"
ON public.seminars FOR DELETE
USING (public.is_admin(auth.uid()));

-- Fix site_content: Remove duplicate "Allow public read" policy
DROP POLICY IF EXISTS "Allow public read" ON public.site_content;

-- Fix profiles: Add explicit DELETE policy (prevent deletion)
CREATE POLICY "Users cannot delete profiles"
ON public.profiles FOR DELETE
USING (false);

-- Fix user_roles: Add restrictive policies for INSERT, UPDATE, DELETE (admin only)
CREATE POLICY "Admins can insert user_roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update user_roles"
ON public.user_roles FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete user_roles"
ON public.user_roles FOR DELETE
USING (public.is_admin(auth.uid()));

-- Fix scraper_logs: Make logs immutable (no updates or deletes)
CREATE POLICY "No one can update scraper_logs"
ON public.scraper_logs FOR UPDATE
USING (false);

CREATE POLICY "No one can delete scraper_logs"
ON public.scraper_logs FOR DELETE
USING (false);

-- Fix seminar_waitlist: Restrict UPDATE to admins only
CREATE POLICY "Admins can update seminar_waitlist"
ON public.seminar_waitlist FOR UPDATE
USING (public.is_admin(auth.uid()));