-- Create Role Enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('admin', 'supervisor', 'member');
    END IF;
END $$;

-- Create Profile Table
CREATE TABLE IF NOT EXISTS public.profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    role public.user_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Code Table
CREATE TABLE IF NOT EXISTS public.code (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codex TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Profile
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profile' AND policyname = 'Users can view their own profile'
    ) THEN
        CREATE POLICY "Users can view their own profile" 
        ON public.profile FOR SELECT 
        USING ( (SELECT auth.uid()) = id );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profile' AND policyname = 'Users can update their own profile'
    ) THEN
        CREATE POLICY "Users can update their own profile" 
        ON public.profile FOR UPDATE 
        USING ( (SELECT auth.uid()) = id );
    END IF;
END $$;

-- RLS Policies for Code
-- Assuming authenticated users can read codes to verify during registration/process
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'code' AND policyname = 'Authenticated users can view codes'
    ) THEN
        CREATE POLICY "Authenticated users can view codes" 
        ON public.code FOR SELECT 
        TO authenticated
        USING ( true );
    END IF;
END $$;
