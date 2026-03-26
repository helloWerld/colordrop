-- Simplify credits model: add paid_credits balance.
-- Leaves legacy per-pack columns (credits_single, credits_pack_50, credits_pack_100)
-- in place for backward compatibility; they will be removed in a later migration.

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS paid_credits INT NOT NULL DEFAULT 0 CHECK (paid_credits >= 0);

