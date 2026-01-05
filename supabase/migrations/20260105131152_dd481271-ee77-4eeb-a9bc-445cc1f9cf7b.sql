-- Ensure anon/authenticated roles have table privileges
GRANT INSERT ON TABLE public.seminar_waitlist TO anon, authenticated;
GRANT SELECT ON TABLE public.seminar_waitlist TO anon, authenticated;

-- Recreate INSERT policy scoped explicitly to anon+authenticated
DROP POLICY IF EXISTS "Anyone can insert into seminar_waitlist" ON public.seminar_waitlist;

CREATE POLICY "Anyone can insert into seminar_waitlist"
ON public.seminar_waitlist
AS PERMISSIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (true);