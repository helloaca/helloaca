-- Add missing columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'EST';

-- Update existing records to have default timezone if null
UPDATE user_profiles 
SET timezone = 'EST' 
WHERE timezone IS NULL;