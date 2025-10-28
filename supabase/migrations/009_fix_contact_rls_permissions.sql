-- Enable Row Level Security on contact_submissions table
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public contact submissions" ON contact_submissions;

-- Create policy to allow anyone to insert contact form submissions
CREATE POLICY "Allow public contact submissions"
ON contact_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Optional: Create policy to allow reading submissions (if needed)
DROP POLICY IF EXISTS "Allow reading contact submissions" ON contact_submissions;

CREATE POLICY "Allow reading contact submissions"
ON contact_submissions
FOR SELECT
TO anon, authenticated
USING (true);

-- Grant necessary permissions
GRANT INSERT ON contact_submissions TO anon, authenticated;
GRANT SELECT ON contact_submissions TO anon, authenticated;