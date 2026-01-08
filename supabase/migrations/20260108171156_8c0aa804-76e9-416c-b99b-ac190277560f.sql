-- NUKE seminar_waitlist RLS policies (temporary unblock)
DO $$
BEGIN
  -- Drop known policies if they exist
  EXECUTE 'DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.seminar_waitlist';
  EXECUTE 'DROP POLICY IF EXISTS "Users can check own email status" ON public.seminar_waitlist';
END $$;

-- Disable Row Level Security on this table
ALTER TABLE public.seminar_waitlist DISABLE ROW LEVEL SECURITY;