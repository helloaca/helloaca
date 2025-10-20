-- Add missing columns to user_profiles table
-- This migration adds company, role, and timezone fields to support Settings page functionality

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'EST';

-- Update the handle_new_user function to include the new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, first_name, last_name, company, role, timezone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'firstName',
    NEW.raw_user_meta_data->>'lastName',
    NEW.raw_user_meta_data->>'company',
    NEW.raw_user_meta_data->>'role',
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'EST')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;