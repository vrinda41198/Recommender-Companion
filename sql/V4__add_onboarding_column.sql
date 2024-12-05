-- Add onboarding_completed column to rc_user
ALTER TABLE rc_user
ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;