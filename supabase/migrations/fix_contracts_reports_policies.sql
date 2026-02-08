-- Clean and re-create safe, non-recursive RLS policies for key tables

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contracts' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.contracts', r.policyname);
  END LOOP;

  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reports' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.reports', r.policyname);
  END LOOP;
END$$;

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- contracts policies
CREATE POLICY contracts_select_owner
ON public.contracts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY contracts_insert_owner
ON public.contracts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY contracts_update_owner
ON public.contracts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY contracts_delete_owner
ON public.contracts
FOR DELETE
USING (auth.uid() = user_id);

-- reports policies
CREATE POLICY reports_select_owner
ON public.reports
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY reports_insert_owner
ON public.reports
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY reports_update_owner
ON public.reports
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY reports_delete_owner
ON public.reports
FOR DELETE
USING (auth.uid() = user_id);
