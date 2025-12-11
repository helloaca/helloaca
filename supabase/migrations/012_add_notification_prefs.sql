-- Notification preferences on user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS notify_email_reports BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_analysis_complete BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_weekly_digest BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_low_credits BOOLEAN DEFAULT true;

UPDATE user_profiles
SET 
  notify_email_reports = COALESCE(notify_email_reports, false),
  notify_analysis_complete = COALESCE(notify_analysis_complete, false),
  notify_weekly_digest = COALESCE(notify_weekly_digest, false),
  notify_low_credits = COALESCE(notify_low_credits, true);