-- Drop existing permissive INSERT and UPDATE policies
DROP POLICY IF EXISTS "Authenticated users can update site_content" ON public.site_content;
DROP POLICY IF EXISTS "Authenticated users can insert site_content" ON public.site_content;

-- Create admin-only UPDATE policy
CREATE POLICY "Admins can update site_content"
ON public.site_content
FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Create admin-only INSERT policy
CREATE POLICY "Admins can insert site_content"
ON public.site_content
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));