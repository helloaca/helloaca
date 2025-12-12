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
