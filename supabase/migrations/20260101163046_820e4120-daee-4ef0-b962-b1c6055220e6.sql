-- Ensure there is only one row per content key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'site_content_key_unique'
      AND conrelid = 'public.site_content'::regclass
  ) THEN
    ALTER TABLE public.site_content
      ADD CONSTRAINT site_content_key_unique UNIQUE (key);
  END IF;
END $$;

-- Make sure RLS is enabled (should already be)
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Allow public updates/inserts ONLY for legal content keys (temporary debug access)
DROP POLICY IF EXISTS "Public can update legal site_content" ON public.site_content;
CREATE POLICY "Public can update legal site_content"
ON public.site_content
FOR UPDATE
USING (key IN ('impressum', 'datenschutz', 'disclaimer'))
WITH CHECK (key IN ('impressum', 'datenschutz', 'disclaimer'));

DROP POLICY IF EXISTS "Public can insert legal site_content" ON public.site_content;
CREATE POLICY "Public can insert legal site_content"
ON public.site_content
FOR INSERT
WITH CHECK (key IN ('impressum', 'datenschutz', 'disclaimer'));

-- Note: delete remains admin-only via existing policy.