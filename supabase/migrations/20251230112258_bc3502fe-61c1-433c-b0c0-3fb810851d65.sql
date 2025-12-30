-- Step 1: Add all new German values to existing enum first
ALTER TYPE public.art_category ADD VALUE IF NOT EXISTS 'Malerei';
ALTER TYPE public.art_category ADD VALUE IF NOT EXISTS 'Skulptur';
ALTER TYPE public.art_category ADD VALUE IF NOT EXISTS 'Fotografie';
ALTER TYPE public.art_category ADD VALUE IF NOT EXISTS 'Mixed Media';
ALTER TYPE public.art_category ADD VALUE IF NOT EXISTS 'Installation';
ALTER TYPE public.art_category ADD VALUE IF NOT EXISTS 'Residenz';
ALTER TYPE public.art_category ADD VALUE IF NOT EXISTS 'Förderung';
ALTER TYPE public.art_category ADD VALUE IF NOT EXISTS 'Stipendium';
ALTER TYPE public.art_category ADD VALUE IF NOT EXISTS 'Ausstellung';
ALTER TYPE public.art_category ADD VALUE IF NOT EXISTS 'Kunst am Bau';
ALTER TYPE public.art_category ADD VALUE IF NOT EXISTS 'Medienkunst';