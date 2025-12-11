-- Add credits balance to user_profiles for persistent credits across devices
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS credits_balance INTEGER DEFAULT 0;

-- Ensure existing rows have a non-null value
UPDATE user_profiles SET credits_balance = COALESCE(credits_balance, 0);

-- Optional: maintain updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to user_profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'user_profiles_set_updated_at'
  ) THEN
    CREATE TRIGGER user_profiles_set_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;