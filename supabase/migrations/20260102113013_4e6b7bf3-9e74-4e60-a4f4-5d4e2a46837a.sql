-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Admins can insert site_content" ON public.site_content;

-- Create new policy allowing ANY authenticated user to insert
CREATE POLICY "Authenticated users can insert site_content" 
ON public.site_content 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);