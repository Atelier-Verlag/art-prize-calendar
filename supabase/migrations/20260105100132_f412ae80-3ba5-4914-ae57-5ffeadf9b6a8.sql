-- Add status column to seminar_waitlist with default 'pending' for double opt-in
ALTER TABLE public.seminar_waitlist 
ADD COLUMN status text NOT NULL DEFAULT 'pending';

-- Add index for faster status queries
CREATE INDEX idx_seminar_waitlist_status ON public.seminar_waitlist(status);