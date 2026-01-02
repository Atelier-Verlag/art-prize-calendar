-- Add eligibility_restriction column for granular geographic limitations
-- Examples: "Only for artists living in Cologne", "Only for Tyrolean artists", "Open to all EU residents"
ALTER TABLE public.art_prizes 
ADD COLUMN eligibility_restriction text DEFAULT NULL;

-- Add a comment to document the column's purpose
COMMENT ON COLUMN public.art_prizes.eligibility_restriction IS 'Granular geographic or residency restrictions beyond country/region (e.g., city-level, specific residency requirements for DACH entries)';