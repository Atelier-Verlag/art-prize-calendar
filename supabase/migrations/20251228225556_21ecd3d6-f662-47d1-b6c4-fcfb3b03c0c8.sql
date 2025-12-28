-- Allow admins to update art_prizes
CREATE POLICY "Admins can update art_prizes"
ON public.art_prizes
FOR UPDATE
USING (is_admin(auth.uid()));

-- Allow admins to delete art_prizes
CREATE POLICY "Admins can delete art_prizes"
ON public.art_prizes
FOR DELETE
USING (is_admin(auth.uid()));

-- Allow admins to insert art_prizes
CREATE POLICY "Admins can insert art_prizes"
ON public.art_prizes
FOR INSERT
WITH CHECK (is_admin(auth.uid()));