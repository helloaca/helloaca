CREATE TABLE IF NOT EXISTS public.waitlist_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text NOT NULL,
  plans text[] NOT NULL,
  user_id uuid,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist_signups (email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON public.waitlist_signups (created_at DESC);
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_signups FORCE ROW LEVEL SECURITY;
CREATE POLICY "waitlist_insert_anyone" ON public.waitlist_signups FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "waitlist_select_admin" ON public.waitlist_signups FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND (plan = 'business' OR email = 'admin@helloaca.xyz')));
CREATE POLICY "waitlist_update_admin" ON public.waitlist_signups FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND (plan = 'business' OR email = 'admin@helloaca.xyz')));
CREATE POLICY "waitlist_delete_admin" ON public.waitlist_signups FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND (plan = 'business' OR email = 'admin@helloaca.xyz')));
GRANT INSERT ON public.waitlist_signups TO anon;
GRANT INSERT ON public.waitlist_signups TO authenticated;
GRANT SELECT ON public.waitlist_signups TO authenticated;
GRANT UPDATE ON public.waitlist_signups TO authenticated;
GRANT DELETE ON public.waitlist_signups TO authenticated;
