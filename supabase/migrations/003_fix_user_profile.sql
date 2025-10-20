-- Fix user profile for the current user
-- This will create a profile record with proper first_name and last_name

INSERT INTO user_profiles (id, email, first_name, last_name, plan)
VALUES (
  '78a52b89-61f5-4101-b1ae-8d14a4c6b118',
  'ozoemenachidile@gmail.com',
  'Ozoemen',
  'Achidile',
  'free'
)
ON CONFLICT (id) DO UPDATE SET
  first_name = 'Ozoemen',
  last_name = 'Achidile',
  updated_at = NOW();