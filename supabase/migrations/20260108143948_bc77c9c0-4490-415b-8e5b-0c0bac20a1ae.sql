-- Add missing columns to existing tenders table
ALTER TABLE public.tenders
ADD COLUMN IF NOT EXISTS organizer text,
ADD COLUMN IF NOT EXISTS disciplines text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS prize_detail text,
ADD COLUMN IF NOT EXISTS entry_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS artist_fee boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS geo_scope text DEFAULT 'national',
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS application_link text;

-- Drop old columns that are being replaced
ALTER TABLE public.tenders
DROP COLUMN IF EXISTS budget,
DROP COLUMN IF EXISTS country,
DROP COLUMN IF EXISTS source_url,
DROP COLUMN IF EXISTS is_premium,
DROP COLUMN IF EXISTS trust_status;