-- Harden and optimize RLS policies: use (select auth.uid()) and reduce multiple permissive policies

BEGIN;

-- user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK ((select auth.uid()) = id);

-- contracts
DROP POLICY IF EXISTS "Users can view own contracts" ON public.contracts;
CREATE POLICY "Users can view own contracts" ON public.contracts
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own contracts" ON public.contracts;
CREATE POLICY "Users can insert own contracts" ON public.contracts
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own contracts" ON public.contracts;
CREATE POLICY "Users can update own contracts" ON public.contracts
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own contracts" ON public.contracts;
CREATE POLICY "Users can delete own contracts" ON public.contracts
  FOR DELETE USING ((select auth.uid()) = user_id);

-- messages
DROP POLICY IF EXISTS "Users can view messages for own contracts" ON public.messages;
CREATE POLICY "Users can view messages for own contracts" ON public.messages
  FOR SELECT USING (
    (select auth.uid()) = user_id AND 
    contract_id IN (SELECT id FROM public.contracts WHERE user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "Users can insert messages for own contracts" ON public.messages;
CREATE POLICY "Users can insert messages for own contracts" ON public.messages
  FOR INSERT WITH CHECK (
    (select auth.uid()) = user_id AND 
    contract_id IN (SELECT id FROM public.contracts WHERE user_id = (select auth.uid()))
  );

-- reports
DROP POLICY IF EXISTS "Users can view reports for own contracts" ON public.reports;
CREATE POLICY "Users can view reports for own contracts" ON public.reports
  FOR SELECT USING (
    (select auth.uid()) = user_id AND 
    contract_id IN (SELECT id FROM public.contracts WHERE user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "Users can insert reports for own contracts" ON public.reports;
CREATE POLICY "Users can insert reports for own contracts" ON public.reports
  FOR INSERT WITH CHECK (
    (select auth.uid()) = user_id AND 
    contract_id IN (SELECT id FROM public.contracts WHERE user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "Users can update reports for own contracts" ON public.reports;
CREATE POLICY "Users can update reports for own contracts" ON public.reports
  FOR UPDATE USING (
    (select auth.uid()) = user_id AND 
    contract_id IN (SELECT id FROM public.contracts WHERE user_id = (select auth.uid()))
  );

-- team_members: reduce multiple permissive policies into one SELECT policy
DROP POLICY IF EXISTS "Owners can view own team members" ON public.team_members;
DROP POLICY IF EXISTS "Members can view own membership" ON public.team_members;
CREATE POLICY "Team members select consolidated" ON public.team_members
  FOR SELECT USING (
    (select auth.uid()) = owner_id OR 
    (member_id IS NOT NULL AND (select auth.uid()) = member_id)
  );

-- contact_submissions: drop duplicate permissive policies if present
DROP POLICY IF EXISTS allow_public_insert ON public.contact_submissions;
DROP POLICY IF EXISTS contact_insert_policy ON public.contact_submissions;
DROP POLICY IF EXISTS contact_public_insert ON public.contact_submissions;
DROP POLICY IF EXISTS allow_admin_select ON public.contact_submissions;
DROP POLICY IF EXISTS contact_admin_select ON public.contact_submissions;
DROP POLICY IF EXISTS contact_select_policy ON public.contact_submissions;
DROP POLICY IF EXISTS allow_admin_update ON public.contact_submissions;
DROP POLICY IF EXISTS contact_admin_update ON public.contact_submissions;
DROP POLICY IF EXISTS contact_update_policy ON public.contact_submissions;

-- keep minimal, optimized policies
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;
CREATE POLICY "Anyone can submit contact form" ON public.contact_submissions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can view all submissions" ON public.contact_submissions;
CREATE POLICY "Admin can view all submissions" ON public.contact_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = (select auth.uid()) 
      AND (plan = 'business' OR email = 'admin@helloaca.xyz')
    )
  );

DROP POLICY IF EXISTS "Admin can update submissions" ON public.contact_submissions;
CREATE POLICY "Admin can update submissions" ON public.contact_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = (select auth.uid()) 
      AND (plan = 'business' OR email = 'admin@helloaca.xyz')
    )
  );

COMMIT;

