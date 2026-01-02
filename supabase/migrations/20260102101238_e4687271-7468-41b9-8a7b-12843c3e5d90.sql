-- Add trust_status column to tenders table for "Black Sheep" feature
ALTER TABLE public.tenders 
ADD COLUMN IF NOT EXISTS trust_status TEXT NOT NULL DEFAULT 'verified';