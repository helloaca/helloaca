-- Final fix for contact_submissions RLS policies
-- This migration ensures anonymous users can insert contact form submissions

-- First, disable RLS temporarily to clean up
ALTER TABLE contact_submissions DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can submit contact form" ON contact_submissions;
DROP POLICY IF EXISTS "Public can insert contact submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Admin can view all submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Admin can update submissions" ON contact_submissions;

-- Re-enable RLS
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows anyone to insert
CREATE POLICY "allow_public_insert" ON contact_submissions
  FOR INSERT 
  WITH CHECK (true);

-- Create admin policies for viewing and updating
CREATE POLICY "allow_admin_select" ON contact_submissions
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (plan = 'business' OR email = 'admin@helloaca.xyz')
    )
  );

CREATE POLICY "allow_admin_update" ON contact_submissions
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (plan = 'business' OR email = 'admin@helloaca.xyz')
    )
  );

-- Grant necessary permissions
GRANT INSERT ON contact_submissions TO anon;
GRANT INSERT ON contact_submissions TO authenticated;
GRANT SELECT, UPDATE ON contact_submissions TO authenticated;

-- Also grant usage on the sequence for the id column
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;