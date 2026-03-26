-- Collections: users can group saved conversions (e.g. "John's Wedding", "Sam's birthday")
-- Each saved_conversion can belong to at most one collection.

CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_collections_user_id ON collections(user_id);

ALTER TABLE saved_conversions
  ADD COLUMN collection_id UUID REFERENCES collections(id) ON DELETE SET NULL;

CREATE INDEX idx_saved_conversions_collection_id ON saved_conversions(collection_id);

-- RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
