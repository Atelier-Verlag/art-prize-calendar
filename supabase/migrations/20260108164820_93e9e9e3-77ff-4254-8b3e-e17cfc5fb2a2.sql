-- Add explicit deny for anonymous SELECT on profiles table
-- This ensures only authenticated users can read their own profile

-- First check: existing policy only allows users to view own profile
-- But we need to explicitly block anonymous users from any access

CREATE POLICY "Deny anonymous access to profiles" 
ON public.profiles 
FOR SELECT 
TO anon
USING (false);

-- Add explicit deny for anonymous INSERT attempts on user_roles
CREATE POLICY "Deny anonymous insert to user_roles" 
ON public.user_roles 
FOR INSERT 
TO anon
WITH CHECK (false);

-- Add explicit deny for anonymous SELECT on user_roles  
CREATE POLICY "Deny anonymous select on user_roles" 
ON public.user_roles 
FOR SELECT 
TO anon
USING (false);