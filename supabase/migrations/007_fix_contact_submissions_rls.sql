-- Fix RLS policy for contact_submissions table to allow public insertions

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can submit contact form" ON contact_submissions;
DROP POLICY IF EXISTS "Admin can view all submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Admin can update submissions" ON contact_submissions;

-- Recreate the insert policy with explicit permissions
CREATE POLICY "Public can insert contact submissions" ON contact_submissions
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

-- Admin policies for viewing and updating
CREATE POLICY "Admin can view all submissions" ON contact_submissions
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (plan = 'business' OR email = 'admin@helloaca.xyz')
    )
  );

CREATE POLICY "Admin can update submissions" ON contact_submissions
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (plan = 'business' OR email = 'admin@helloaca.xyz')
    )
  );

-- Ensure proper grants are in place
GRANT INSERT ON contact_submissions TO anon;
GRANT INSERT ON contact_submissions TO authenticated;
GRANT SELECT, UPDATE ON contact_submissions TO authenticated;