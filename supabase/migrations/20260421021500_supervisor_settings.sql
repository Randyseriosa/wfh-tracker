-- Add supervisor_id to settings table
ALTER TABLE public.settings ADD COLUMN supervisor_id UUID REFERENCES public.profile(id);

-- Add unique constraint to ensure each supervisor only has one 'default' setting
-- We use 'default-credits' as the name for the credit count setting
ALTER TABLE public.settings ADD CONSTRAINT unique_supervisor_setting_name UNIQUE (name, supervisor_id);

-- Update RLS policies for settings
DROP POLICY IF EXISTS "Supervisors and Admin can manage settings" ON public.settings;

CREATE POLICY "Supervisors can manage their own settings" ON public.settings FOR ALL TO authenticated
    USING ( 
        supervisor_id = (SELECT auth.uid()) 
        OR (SELECT role FROM public.profile WHERE id = (SELECT auth.uid())) = 'admin'
    );

CREATE POLICY "Anyone can view settings" ON public.settings FOR SELECT TO authenticated
    USING (true);
