-- 1) Roles enum + roles table (do NOT rely on profiles.is_admin)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can read their own roles (needed for UI)
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- 2) Security-definer role check (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 3) Replace is_admin() to use roles table (existing RLS uses is_admin(auth.uid()))
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(_user_id, 'admin'::public.app_role)
$$;

-- 4) Backfill roles from existing profiles.is_admin (one-time migration)
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'admin'::public.app_role
FROM public.profiles p
WHERE COALESCE(p.is_admin, false) = true
ON CONFLICT (user_id, role) DO NOTHING;

-- 5) Lock down site_content writes: remove temporary public write policies
DROP POLICY IF EXISTS "Public can update legal site_content" ON public.site_content;
DROP POLICY IF EXISTS "Public can insert legal site_content" ON public.site_content;

-- Ensure admin policies exist and reference is_admin() (now role-based)
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can insert site_content" ON public.site_content;
CREATE POLICY "Admins can insert site_content"
ON public.site_content
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update site_content" ON public.site_content;
CREATE POLICY "Admins can update site_content"
ON public.site_content
FOR UPDATE
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete site_content" ON public.site_content;
CREATE POLICY "Admins can delete site_content"
ON public.site_content
FOR DELETE
USING (public.is_admin(auth.uid()));

-- Keep public read policy as-is
DROP POLICY IF EXISTS "Anyone can read site_content" ON public.site_content;
CREATE POLICY "Anyone can read site_content"
ON public.site_content
FOR SELECT
USING (true);
