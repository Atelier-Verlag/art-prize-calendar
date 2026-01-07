-- Recreate RLS policies for site_content
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- Drop known policies if they exist
  EXECUTE 'DROP POLICY IF EXISTS "Allow public read" ON public.site_content';
  EXECUTE 'DROP POLICY IF EXISTS "Allow admin all" ON public.site_content';
  EXECUTE 'DROP POLICY IF EXISTS "Anon can read site_content" ON public.site_content';
  EXECUTE 'DROP POLICY IF EXISTS "Authenticated can read site_content" ON public.site_content';
  EXECUTE 'DROP POLICY IF EXISTS "Admins can insert site_content" ON public.site_content';
  EXECUTE 'DROP POLICY IF EXISTS "Admins can update site_content" ON public.site_content';
  EXECUTE 'DROP POLICY IF EXISTS "Admins can delete site_content" ON public.site_content';
END $$;

-- Public read
CREATE POLICY "Allow public read"
ON public.site_content
FOR SELECT
USING (true);

-- Admin write (explicit commands)
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


-- Recreate RLS policies for seminars
ALTER TABLE public.seminars ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Allow public read" ON public.seminars';
  EXECUTE 'DROP POLICY IF EXISTS "Allow admin all" ON public.seminars';
  EXECUTE 'DROP POLICY IF EXISTS "Anyone can read seminars" ON public.seminars';
  EXECUTE 'DROP POLICY IF EXISTS "Admins can insert seminars" ON public.seminars';
  EXECUTE 'DROP POLICY IF EXISTS "Admins can update seminars" ON public.seminars';
  EXECUTE 'DROP POLICY IF EXISTS "Admins can delete seminars" ON public.seminars';
END $$;

CREATE POLICY "Allow public read"
ON public.seminars
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert seminars"
ON public.seminars
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update seminars"
ON public.seminars
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete seminars"
ON public.seminars
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));