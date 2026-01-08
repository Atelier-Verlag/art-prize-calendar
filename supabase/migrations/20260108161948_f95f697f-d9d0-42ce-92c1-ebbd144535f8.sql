-- Clean up remaining duplicate policies on seminar_waitlist
DROP POLICY IF EXISTS "Anyone can insert to waitlist" ON public.seminar_waitlist;
DROP POLICY IF EXISTS "Admins can delete from seminar_waitlist" ON public.seminar_waitlist;
DROP POLICY IF EXISTS "Admins can read seminar_waitlist" ON public.seminar_waitlist;
DROP POLICY IF EXISTS "Admins can update seminar_waitlist" ON public.seminar_waitlist;