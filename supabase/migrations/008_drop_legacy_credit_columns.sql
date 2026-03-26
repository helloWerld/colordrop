-- Cleanup legacy per-pack credit columns now that the app
-- uses free_conversions_remaining + paid_credits only.

ALTER TABLE user_profiles
DROP COLUMN IF EXISTS credits_single,
DROP COLUMN IF EXISTS credits_pack_50,
DROP COLUMN IF EXISTS credits_pack_100;

