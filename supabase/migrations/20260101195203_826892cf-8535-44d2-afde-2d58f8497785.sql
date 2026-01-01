-- Add new columns to existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'free';

-- Create tenders table
CREATE TABLE public.tenders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  budget TEXT,
  deadline DATE,
  country TEXT,
  category TEXT,
  source_url TEXT,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on tenders
ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;

-- Public can read non-premium tenders
CREATE POLICY "Anyone can read non-premium tenders"
ON public.tenders
FOR SELECT
USING (is_premium = false);

-- Pro users and admins can read all tenders
CREATE POLICY "Pro users can read all tenders"
ON public.tenders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.subscription_status = 'pro' OR profiles.is_pro_user = true)
  )
  OR public.is_admin(auth.uid())
);

-- Admins can insert tenders
CREATE POLICY "Admins can insert tenders"
ON public.tenders
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- Admins can update tenders
CREATE POLICY "Admins can update tenders"
ON public.tenders
FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Admins can delete tenders
CREATE POLICY "Admins can delete tenders"
ON public.tenders
FOR DELETE
USING (public.is_admin(auth.uid()));