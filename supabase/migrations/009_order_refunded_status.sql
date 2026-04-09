-- Fulfillment auto-refund: terminal state when payment is returned to the customer.
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (
  status IN (
    'pending',
    'paid',
    'processing',
    'submitted_to_print',
    'in_production',
    'shipped',
    'delivered',
    'error',
    'refunded'
  )
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_refund_id TEXT;
