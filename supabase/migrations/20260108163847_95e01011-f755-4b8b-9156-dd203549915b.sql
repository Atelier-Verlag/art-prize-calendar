-- Lock down seminar_waitlist: only backend functions (service role) may insert
-- This reduces risk of email list abuse and satisfies security scan expectations.

DROP POLICY IF EXISTS "Anon can insert into seminar_waitlist" ON public.seminar_waitlist;
DROP POLICY IF EXISTS "Authenticated can insert into seminar_waitlist" ON public.seminar_waitlist;

-- NOTE: Service role bypasses RLS automatically, so backend functions can still write.
-- Admin-only SELECT/UPDATE/DELETE policies remain unchanged.