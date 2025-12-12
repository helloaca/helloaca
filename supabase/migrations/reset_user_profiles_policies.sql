-- Reset all RLS policies on user_profiles and re-create minimal, non-recursive owner policies

DO $$
DECLARE r RECORD;
BEGIN
  -- Temporarily disable RLS to avoid recursion during policy manipulation
  EXECUTE 'ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY';

  -- Drop ALL existing policies on user_profiles regardless of names
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_profiles' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_profiles', r.policyname);
  END LOOP;
END$$;

-- Re-enable RLS and create minimal, non-recursive policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_profiles_select_owner
ON public.user_profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY user_profiles_update_owner
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY user_profiles_insert_owner
ON public.user_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);
