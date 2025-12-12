-- Pin search_path for security on selected public functions without changing bodies
-- This migration queries pg_catalog to obtain function signatures and applies ALTER FUNCTION accordingly.

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT n.nspname AS schema,
           p.proname AS name,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'check_contact_rate_limit',
        'set_updated_at',
        'handle_updated_at_team_members',
        'handle_new_user_invites',
        'handle_new_user',
        'handle_updated_at'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public', r.schema, r.name, r.args);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Note: Setting search_path to 'public' pins resolution to the public schema while avoiding breakage.
-- For maximum hardening per Supabase advisor, consider refactoring function bodies to fully qualify
-- all references and then set search_path = '' in a subsequent migration.
