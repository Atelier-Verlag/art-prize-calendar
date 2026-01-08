-- Fix seminar_waitlist: Add public INSERT policy so users can sign up for the waitlist
CREATE POLICY "Anyone can join waitlist"
ON public.seminar_waitlist
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Also add a SELECT policy so users can check if their email is already registered
CREATE POLICY "Users can check own email status"
ON public.seminar_waitlist
FOR SELECT
TO anon, authenticated
USING (email = current_setting('request.jwt.claims', true)::json->>'email');