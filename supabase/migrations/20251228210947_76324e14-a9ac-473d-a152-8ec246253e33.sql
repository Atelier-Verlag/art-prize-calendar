-- Add is_admin column to profiles table
ALTER TABLE public.profiles ADD COLUMN is_admin boolean NOT NULL DEFAULT false;

-- Create site_content table for CMS
CREATE TABLE public.site_content (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  content text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on site_content
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = _user_id),
    false
  )
$$;

-- RLS: Everyone can read site_content
CREATE POLICY "Anyone can read site_content"
ON public.site_content
FOR SELECT
USING (true);

-- RLS: Only admins can insert site_content
CREATE POLICY "Admins can insert site_content"
ON public.site_content
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- RLS: Only admins can update site_content
CREATE POLICY "Admins can update site_content"
ON public.site_content
FOR UPDATE
USING (public.is_admin(auth.uid()));

-- RLS: Only admins can delete site_content
CREATE POLICY "Admins can delete site_content"
ON public.site_content
FOR DELETE
USING (public.is_admin(auth.uid()));

-- Trigger for updated_at on site_content
CREATE TRIGGER update_site_content_updated_at
BEFORE UPDATE ON public.site_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default content
INSERT INTO public.site_content (key, content) VALUES
('impressum', ''),
('datenschutz', ''),
('disclaimer', '');