-- Add initial_credits to members table
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS initial_credits INT DEFAULT 0;

-- Update existing members to have their current wfh_credits as initial_credits as a starting point
UPDATE public.members m
SET initial_credits = c.wfh_credits
FROM public.credits c
WHERE m.id = c.member_id;
