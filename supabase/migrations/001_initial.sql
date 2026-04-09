-- ColorDrop MVP schema (PRD §6.2)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles: free credits + purchased credit pools
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL,
  free_conversions_remaining INT NOT NULL DEFAULT 5 CHECK (free_conversions_remaining >= 0),
  credits_single INT NOT NULL DEFAULT 0 CHECK (credits_single >= 0),
  credits_pack_50 INT NOT NULL DEFAULT 0 CHECK (credits_pack_50 >= 0),
  credits_pack_100 INT NOT NULL DEFAULT 0 CHECK (credits_pack_100 >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- Saved conversions (library)
CREATE TABLE saved_conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  original_image_path TEXT NOT NULL,
  outline_image_path TEXT NOT NULL,
  conversion_context TEXT NOT NULL CHECK (conversion_context IN ('one_off', 'book')),
  stylization TEXT NOT NULL CHECK (stylization IN ('none', 'fairy_tale', 'cartoon', 'storybook', 'sketch')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_saved_conversions_user_created ON saved_conversions(user_id, created_at DESC);

-- Optional: credit transaction audit
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'use_book', 'use_one_off')),
  package_type TEXT CHECK (package_type IN ('single', 'pack_50', 'pack_100')),
  quantity INT NOT NULL,
  value_cents INT,
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Books
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'My Coloring Book',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'previewing', 'ordering', 'paid', 'producing', 'shipped', 'delivered')),
  trim_size TEXT NOT NULL DEFAULT '0850X1100',
  pod_package_id TEXT NOT NULL DEFAULT '0850X1100BWSTDPB060UW444MXX',
  page_count INT NOT NULL DEFAULT 0,
  credits_applied_value_cents INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_books_user_status ON books(user_id, status);

-- Pages (interior)
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  position INT NOT NULL,
  saved_conversion_id UUID REFERENCES saved_conversions(id),
  original_image_path TEXT NOT NULL,
  outline_image_path TEXT NOT NULL,
  conversion_status TEXT NOT NULL CHECK (conversion_status IN ('pending', 'processing', 'completed', 'failed')),
  provider_prediction_id TEXT,
  credit_value_cents INT CHECK (credit_value_cents IS NULL OR credit_value_cents IN (15, 20, 25)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(book_id, position)
);

CREATE INDEX idx_pages_book_id ON pages(book_id);

-- Covers
CREATE TABLE covers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL UNIQUE REFERENCES books(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  cover_pdf_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL UNIQUE REFERENCES books(id),
  user_id TEXT NOT NULL,
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  amount_total INT,
  currency TEXT DEFAULT 'usd',
  shipping_name TEXT,
  shipping_address_line1 TEXT,
  shipping_address_line2 TEXT,
  shipping_city TEXT,
  shipping_state TEXT,
  shipping_postal_code TEXT,
  shipping_country TEXT,
  shipping_phone TEXT,
  shipping_level TEXT CHECK (shipping_level IN ('MAIL', 'PRIORITY_MAIL', 'GROUND', 'EXPEDITED', 'EXPRESS')),
  lulu_print_job_id BIGINT,
  lulu_status TEXT,
  lulu_tracking_id TEXT,
  lulu_tracking_url TEXT,
  credits_applied_value_cents INT NOT NULL DEFAULT 0,
  interior_pdf_path TEXT,
  cover_pdf_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'submitted_to_print', 'in_production', 'shipped', 'delivered', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_book_id ON orders(book_id);

-- RLS: enable on all tables (policies can scope by user_id from app via service role; for direct client access you'd set auth.jwt() ->> 'user_id')
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE covers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policies: allow service role full access; restrict by user_id for anon/authenticated if using Supabase Auth
-- Using service role from Next.js API, so no row-level policies needed for server-side; add policies if you expose Supabase client to browser
CREATE POLICY "Users can read own profile" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (true);
CREATE POLICY "Service role insert profile" ON user_profiles FOR INSERT WITH CHECK (true);
