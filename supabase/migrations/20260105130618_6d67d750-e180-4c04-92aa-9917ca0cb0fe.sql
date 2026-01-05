-- Drop the restrictive INSERT policy and recreate as permissive
DROP POLICY IF EXISTS "Anyone can insert into seminar_waitlist" ON public.seminar_waitlist;

CREATE POLICY "Anyone can insert into seminar_waitlist"
ON public.seminar_waitlist
FOR INSERT
TO public
WITH CHECK (true);