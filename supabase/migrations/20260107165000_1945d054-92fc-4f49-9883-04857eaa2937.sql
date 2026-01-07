-- TEMPORARY: Relax write access to ANY authenticated user for setup

-- site_content
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- Drop all existing policies on site_content
  EXECUTE 'DROP POLICY IF EXISTS "Allow public read" ON public.site_content';
  EXECUTE 'DROP POLICY IF EXISTS "Admins can insert site_content" ON public.site_content';
  EXECUTE 'DROP POLICY IF EXISTS "Admins can update site_content" ON public.site_content';
  EXECUTE 'DROP POLICY IF EXISTS "Admins can delete site_content" ON public.site_content';
  EXECUTE 'DROP POLICY IF EXISTS "Anon can read site_content" ON public.site_content';
  EXECUTE 'DROP POLICY IF EXISTS "Authenticated can read site_content" ON public.site_content';
  EXECUTE 'DROP POLICY IF EXISTS "Allow authenticated all" ON public.site_content';
  EXECUTE 'DROP POLICY IF EXISTS "Allow admin all" ON public.site_content';
END $$;

CREATE POLICY "Allow public read"
ON public.site_content
FOR SELECT
USING (true);

CREATE POLICY "Allow authenticated all"
ON public.site_content
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- seminars
ALTER TABLE public.seminars ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Allow public read" ON public.seminars';
  EXECUTE 'DROP POLICY IF EXISTS "Anyone can read seminars" ON public.seminars';
  EXECUTE 'DROP POLICY IF EXISTS "Admins can insert seminars" ON public.seminars';
  EXECUTE 'DROP POLICY IF EXISTS "Admins can update seminars" ON public.seminars';
  EXECUTE 'DROP POLICY IF EXISTS "Admins can delete seminars" ON public.seminars';
  EXECUTE 'DROP POLICY IF EXISTS "Allow authenticated all" ON public.seminars';
  EXECUTE 'DROP POLICY IF EXISTS "Allow admin all" ON public.seminars';
END $$;

CREATE POLICY "Allow public read"
ON public.seminars
FOR SELECT
USING (true);

CREATE POLICY "Allow authenticated all"
ON public.seminars
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);