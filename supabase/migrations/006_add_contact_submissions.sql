-- Create contact_submissions table for storing contact form submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) >= 2),
  email TEXT NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  subject TEXT NOT NULL CHECK (length(subject) >= 1),
  message TEXT NOT NULL CHECK (length(message) >= 10),
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'responded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on contact_submissions
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for contact_submissions
-- Allow anyone to insert (for public contact form)
CREATE POLICY "Anyone can submit contact form" ON contact_submissions
  FOR INSERT WITH CHECK (true);

-- Only authenticated admin users can view/update submissions
CREATE POLICY "Admin can view all submissions" ON contact_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (plan = 'business' OR email = 'admin@helloaca.xyz')
    )
  );

CREATE POLICY "Admin can update submissions" ON contact_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (plan = 'business' OR email = 'admin@helloaca.xyz')
    )
  );

-- Create index for performance
CREATE INDEX idx_contact_submissions_created_at ON contact_submissions(created_at DESC);
CREATE INDEX idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX idx_contact_submissions_ip_created ON contact_submissions(ip_address, created_at);

-- Create trigger for updated_at
CREATE TRIGGER handle_updated_at_contact_submissions
  BEFORE UPDATE ON contact_submissions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Grant permissions
GRANT SELECT, INSERT ON contact_submissions TO anon;
GRANT SELECT, INSERT, UPDATE ON contact_submissions TO authenticated;

-- Create function to check rate limiting
CREATE OR REPLACE FUNCTION check_contact_rate_limit(client_ip TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  submission_count INTEGER;
BEGIN
  -- Count submissions from this IP in the last hour
  SELECT COUNT(*) INTO submission_count
  FROM contact_submissions
  WHERE ip_address = client_ip
    AND created_at > NOW() - INTERVAL '1 hour';
  
  -- Return false if more than 3 submissions in the last hour
  RETURN submission_count < 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;