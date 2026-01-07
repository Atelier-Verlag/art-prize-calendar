-- Create seminars table for upcoming seminars/Black Sheep section
CREATE TABLE public.seminars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE,
  link TEXT,
  is_black_sheep BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seminars ENABLE ROW LEVEL SECURITY;

-- Everyone can read seminars
CREATE POLICY "Anyone can read seminars"
ON public.seminars
FOR SELECT
USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert seminars"
ON public.seminars
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Only admins can update
CREATE POLICY "Admins can update seminars"
ON public.seminars
FOR UPDATE
USING (is_admin(auth.uid()));

-- Only admins can delete
CREATE POLICY "Admins can delete seminars"
ON public.seminars
FOR DELETE
USING (is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_seminars_updated_at
BEFORE UPDATE ON public.seminars
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Fix site_content RLS policies (change from RESTRICTIVE to PERMISSIVE)
DROP POLICY IF EXISTS "Admins can insert site_content" ON public.site_content;
DROP POLICY IF EXISTS "Admins can update site_content" ON public.site_content;
DROP POLICY IF EXISTS "Admins can delete site_content" ON public.site_content;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Admins can insert site_content"
ON public.site_content
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update site_content"
ON public.site_content
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete site_content"
ON public.site_content
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));