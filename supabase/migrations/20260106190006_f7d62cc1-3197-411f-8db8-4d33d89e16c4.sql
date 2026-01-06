-- Drop the existing restrictive SELECT policies
DROP POLICY IF EXISTS "Anyone can read non-premium tenders" ON public.tenders;
DROP POLICY IF EXISTS "Pro users can read all tenders" ON public.tenders;

-- Create a permissive policy that allows everyone to read all tenders
CREATE POLICY "Tenders are publicly readable"
ON public.tenders
FOR SELECT
USING (true);