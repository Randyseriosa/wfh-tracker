-- Migration to support the Request Portal feature

-- Ensure departments are viewable by everyone (already exists but making sure)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'department' AND policyname = 'Everyone can view departments'
    ) THEN
        CREATE POLICY "Everyone can view departments" ON public.department FOR SELECT TO authenticated, anon USING (true);
    END IF;
END $$;

-- Ensure supervisors are viewable by everyone (already exists but making sure)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'profile' AND policyname = 'Allow public read of supervisor profiles'
    ) THEN
        CREATE POLICY "Allow public read of supervisor profiles" ON public.profile FOR SELECT TO authenticated, anon USING ( role = 'supervisor' );
    END IF;
END $$;

-- No direct SELECT on members for anon to maintain privacy. 
-- The request-portal Edge Function handles member verification using service_role.

-- Add index for performance on member lookup
CREATE INDEX IF NOT EXISTS idx_members_lookup ON public.members (id_num, dept_id, supervisor_id);

-- WFH Requests: the Edge Function will handle inserts.
-- If the UI needed to show status, we would need a policy here.
-- For now, let's add a policy that allows members to view their own requests if they had an account,
-- but since this is a public portal, we'll keep it restricted to supervisors/admins as per existing policies.
