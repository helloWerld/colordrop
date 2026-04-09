-- Admin observability: searchable integration event log + conversion telemetry.

CREATE TABLE integration_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'lulu', 'conversion', 'system')),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warn', 'error')),
  status TEXT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  lulu_print_job_id BIGINT,
  attempt INT,
  error_code TEXT,
  error_message TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_integration_events_provider_created
  ON integration_events(provider, created_at DESC);
CREATE INDEX idx_integration_events_event_type_created
  ON integration_events(event_type, created_at DESC);
CREATE INDEX idx_integration_events_severity_created
  ON integration_events(severity, created_at DESC);
CREATE INDEX idx_integration_events_order_id
  ON integration_events(order_id);
CREATE INDEX idx_integration_events_stripe_session_id
  ON integration_events(stripe_session_id);
CREATE INDEX idx_integration_events_lulu_print_job_id
  ON integration_events(lulu_print_job_id);

ALTER TABLE integration_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role integration events access"
  ON integration_events FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE saved_conversions
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS provider_cost_cents INT,
  ADD COLUMN IF NOT EXISTS conversion_error TEXT;
