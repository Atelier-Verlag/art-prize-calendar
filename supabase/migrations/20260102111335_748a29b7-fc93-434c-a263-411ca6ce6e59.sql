-- Drop existing restrictive UPDATE policy
DROP POLICY IF EXISTS "Admins can update site_content" ON public.site_content;

-- Create new policy allowing ANY authenticated user to update site_content
CREATE POLICY "Authenticated users can update site_content" 
ON public.site_content 
FOR UPDATE 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);