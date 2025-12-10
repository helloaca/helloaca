-- Add welcome notification on new user creation

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'firstName',
    NEW.raw_user_meta_data->>'lastName'
  );

  -- Welcome notification
  INSERT INTO public.notifications (user_id, title, body, type, read)
  VALUES (
    NEW.id,
    'Welcome to HelloACA',
    'Thanks for signing up! You can upload contracts, analyze them in seconds, and export reports.',
    'system',
    FALSE
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
