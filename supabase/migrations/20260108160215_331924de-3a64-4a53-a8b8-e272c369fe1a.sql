-- Fix security issue: Add explicit RLS policies for seminar_waitlist
-- Ensure RLS is enabled
ALTER TABLE public.seminar_waitlist ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to recreate them properly
DROP POLICY IF EXISTS "Anyone can insert to waitlist" ON public.seminar_waitlist;
DROP POLICY IF EXISTS "Only admins can view waitlist" ON public.seminar_waitlist;
DROP POLICY IF EXISTS "Only admins can update waitlist" ON public.seminar_waitlist;
DROP POLICY IF EXISTS "Only admins can delete from waitlist" ON public.seminar_waitlist;

-- Allow anyone to sign up (INSERT only)
CREATE POLICY "Anyone can insert to waitlist" 
ON public.seminar_waitlist 
FOR INSERT 
WITH CHECK (true);

-- Only admins can view the waitlist (SELECT)
CREATE POLICY "Only admins can view waitlist" 
ON public.seminar_waitlist 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- Only admins can update entries
CREATE POLICY "Only admins can update waitlist" 
ON public.seminar_waitlist 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

-- Only admins can delete entries
CREATE POLICY "Only admins can delete from waitlist" 
ON public.seminar_waitlist 
FOR DELETE 
USING (public.is_admin(auth.uid()));

-- Enable leaked password protection
-- Note: This is typically done via Supabase dashboard, but we document the intent here