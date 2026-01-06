-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Tenders are publicly readable" ON public.tenders;

-- Create explicit policy for anon role
CREATE POLICY "Anon can read tenders"
ON public.tenders
FOR SELECT
TO anon
USING (true);

-- Create explicit policy for authenticated role
CREATE POLICY "Authenticated can read tenders"
ON public.tenders
FOR SELECT
TO authenticated
USING (true);