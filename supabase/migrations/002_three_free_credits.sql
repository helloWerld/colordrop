-- New users get 3 free conversion credits (was 5)
ALTER TABLE user_profiles
  ALTER COLUMN free_conversions_remaining SET DEFAULT 3;
