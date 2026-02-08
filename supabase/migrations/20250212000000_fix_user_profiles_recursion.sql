-- Fix infinite recursion in user_profiles policies
-- This migration drops existing policies and re-creates them with simple, non-recursive checks.

-- Drop existing policies on user_profiles to clean up
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

-- Create simple, non-recursive policies
-- 1. View: Users can only view their own profile.
-- Note: If you need public profiles, ensure the logic doesn't query user_profiles recursively.
CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = id);

-- 2. Update: Users can only update their own profile.
CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = id);

-- 3. Insert: Users can insert their own profile (usually handled by triggers, but good to have).
CREATE POLICY "Users can insert own profile"
ON public.user_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
