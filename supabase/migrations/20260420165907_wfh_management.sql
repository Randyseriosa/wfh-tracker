-- Create Department Table
CREATE TABLE IF NOT EXISTS public.department (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add dept_id to profile
ALTER TABLE public.profile ADD COLUMN IF NOT EXISTS dept_id UUID REFERENCES public.department(id);

-- Create Members Table
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_num TEXT NOT NULL,
    name TEXT NOT NULL,
    dept_id UUID REFERENCES public.department(id),
    supervisor_id UUID REFERENCES public.profile(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(id_num, name)
);

-- Create WFHRequest Table
CREATE TABLE IF NOT EXISTS public.wfhrequest (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    date_requested DATE NOT NULL DEFAULT CURRENT_DATE,
    date_approved DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- e.g., 'default', 'custom'
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    wfh_credits INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Credits Table
CREATE TABLE IF NOT EXISTS public.credits (
    member_id UUID PRIMARY KEY REFERENCES public.members(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    wfh_credits INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.department ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wfhrequest ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Department: Everyone can read, Admin can manage
CREATE POLICY "Everyone can view departments" ON public.department FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Admin can manage departments" ON public.department FOR ALL TO authenticated 
    USING ( (SELECT role FROM public.profile WHERE id = (SELECT auth.uid())) = 'admin' );

-- Members: Supervisor can see their team, Admin can see all
CREATE POLICY "Supervisors can view their members" ON public.members FOR SELECT TO authenticated
    USING ( supervisor_id = (SELECT auth.uid()) OR (SELECT role FROM public.profile WHERE id = (SELECT auth.uid())) = 'admin' );
CREATE POLICY "Admin can manage members" ON public.members FOR ALL TO authenticated 
    USING ( (SELECT role FROM public.profile WHERE id = (SELECT auth.uid())) = 'admin' );
CREATE POLICY "Supervisors can manage their members" ON public.members FOR ALL TO authenticated
    USING ( supervisor_id = (SELECT auth.uid()) );

-- WFHRequest: Supervisor can view/manage team requests
CREATE POLICY "Supervisors can view team requests" ON public.wfhrequest FOR SELECT TO authenticated
    USING ( 
        EXISTS (
            SELECT 1 FROM public.members 
            WHERE id = member_id AND supervisor_id = (SELECT auth.uid())
        ) 
        OR (SELECT role FROM public.profile WHERE id = (SELECT auth.uid())) = 'admin'
    );
CREATE POLICY "Supervisors can manage team requests" ON public.wfhrequest FOR ALL TO authenticated
    USING ( 
        EXISTS (
            SELECT 1 FROM public.members 
            WHERE id = member_id AND supervisor_id = (SELECT auth.uid())
        ) 
    );

-- Settings: Supervisor/Admin can manage
CREATE POLICY "Supervisors and Admin can manage settings" ON public.settings FOR ALL TO authenticated
    USING ( 
        (SELECT role FROM public.profile WHERE id = (SELECT auth.uid())) IN ('admin', 'supervisor')
    );
CREATE POLICY "Everyone can view settings" ON public.settings FOR SELECT TO authenticated, anon USING (true);

-- Credits: Supervisor can see team credits
CREATE POLICY "Supervisors can view team credits" ON public.credits FOR SELECT TO authenticated
    USING ( 
        EXISTS (
            SELECT 1 FROM public.members 
            WHERE id = member_id AND supervisor_id = (SELECT auth.uid())
        ) 
        OR (SELECT role FROM public.profile WHERE id = (SELECT auth.uid())) = 'admin'
    );
CREATE POLICY "Supervisors can manage team credits" ON public.credits FOR ALL TO authenticated
    USING ( 
        EXISTS (
            SELECT 1 FROM public.members 
            WHERE id = member_id AND supervisor_id = (SELECT auth.uid())
        ) 
    );
