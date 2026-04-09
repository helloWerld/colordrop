-- Persist book + pages + cover inputs at payment (Stripe webhook) for fulfillment.
-- Nullable for orders created before this migration; fulfillment falls back to live rows.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS print_snapshot JSONB;
