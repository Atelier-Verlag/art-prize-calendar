-- Create seminar_waitlist table for collecting emails
CREATE TABLE public.seminar_waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.seminar_waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public signup form)
CREATE POLICY "Anyone can insert into seminar_waitlist" 
ON public.seminar_waitlist 
FOR INSERT 
WITH CHECK (true);

-- Only admins can read the waitlist
CREATE POLICY "Admins can read seminar_waitlist" 
ON public.seminar_waitlist 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Only admins can delete from waitlist
CREATE POLICY "Admins can delete from seminar_waitlist" 
ON public.seminar_waitlist 
FOR DELETE 
USING (is_admin(auth.uid()));