-- Team membership and invite support
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  member_email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Owner','Admin','Member','Viewer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','revoked')),
  plan_inherited TEXT NOT NULL CHECK (plan_inherited IN ('team','business','enterprise')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (owner_id, member_email)
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own team members" ON team_members
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Members can view own membership" ON team_members
  FOR SELECT USING (member_id IS NOT NULL AND auth.uid() = member_id);

CREATE POLICY "Owners can insert team members" ON team_members
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own team members" ON team_members
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE OR REPLACE FUNCTION public.handle_updated_at_team_members()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_updated_at_team_members
  BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at_team_members();

CREATE OR REPLACE FUNCTION public.handle_new_user_invites()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.team_members tm
    SET member_id = NEW.id, status = 'active', updated_at = NOW()
    WHERE tm.member_email = NEW.email AND tm.status = 'pending';

  UPDATE public.user_profiles up
    SET plan = COALESCE((SELECT plan_inherited FROM public.team_members WHERE member_id = NEW.id LIMIT 1), up.plan), updated_at = NOW()
    WHERE up.id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created_invites
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_invites();