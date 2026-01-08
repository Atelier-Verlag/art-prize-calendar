-- Fix seminar_waitlist: remove overly permissive policy, add basic anti-spam safeguards

-- 1) Table hardening (non-breaking defaults)
ALTER TABLE public.seminar_waitlist
  ADD COLUMN IF NOT EXISTS consented_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz NULL;

-- Ensure status is always set
ALTER TABLE public.seminar_waitlist
  ALTER COLUMN status SET DEFAULT 'pending';

-- Prevent duplicate signups (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS seminar_waitlist_email_lower_unique
  ON public.seminar_waitlist (lower(email));

-- 2) RLS: remove the always-true insert policy that triggers the scanner
DROP POLICY IF EXISTS "Anyone can insert to waitlist" ON public.seminar_waitlist;

-- Also remove duplicate legacy admin policies if they exist (keep one clear set)
DROP POLICY IF EXISTS "Admins can read seminar_waitlist" ON public.seminar_waitlist;
DROP POLICY IF EXISTS "Admins can update seminar_waitlist" ON public.seminar_waitlist;
DROP POLICY IF EXISTS "Admins can delete from seminar_waitlist" ON public.seminar_waitlist;

-- 3) Recreate clean, explicit policies
-- Public/anon insert allowed, but must look like a real email and include consent timestamp
DROP POLICY IF EXISTS "Anon can insert into seminar_waitlist" ON public.seminar_waitlist;
CREATE POLICY "Anon can insert into seminar_waitlist"
ON public.seminar_waitlist
FOR INSERT
TO anon
WITH CHECK (
  email IS NOT NULL
  AND email <> ''
  AND length(email) <= 320
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND consented_at IS NOT NULL
);

DROP POLICY IF EXISTS "Authenticated can insert into seminar_waitlist" ON public.seminar_waitlist;
CREATE POLICY "Authenticated can insert into seminar_waitlist"
ON public.seminar_waitlist
FOR INSERT
TO authenticated
WITH CHECK (
  email IS NOT NULL
  AND email <> ''
  AND length(email) <= 320
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND consented_at IS NOT NULL
);

-- Admin-only read/update/delete
DROP POLICY IF EXISTS "Only admins can view waitlist" ON public.seminar_waitlist;
CREATE POLICY "Only admins can view waitlist"
ON public.seminar_waitlist
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Only admins can update waitlist" ON public.seminar_waitlist;
CREATE POLICY "Only admins can update waitlist"
ON public.seminar_waitlist
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Only admins can delete from waitlist" ON public.seminar_waitlist;
CREATE POLICY "Only admins can delete from waitlist"
ON public.seminar_waitlist
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));
