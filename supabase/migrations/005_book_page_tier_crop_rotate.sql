-- Book page tier and per-page crop/rotate for ColorDrop book sizes plan.

-- Books: add page_tier (12, 24, 32, 48, 64, 128). Default 24 for existing rows.
ALTER TABLE books
  ADD COLUMN IF NOT EXISTS page_tier INT NOT NULL DEFAULT 24;

-- Constrain page_tier to allowed values (no CHECK name for compatibility)
ALTER TABLE books
  DROP CONSTRAINT IF EXISTS books_page_tier_check;
ALTER TABLE books
  ADD CONSTRAINT books_page_tier_check CHECK (page_tier IN (12, 24, 32, 48, 64, 128));

-- Pages: crop region (normalized 0-1) and rotation for PDF generation
ALTER TABLE pages
  ADD COLUMN IF NOT EXISTS crop_rect JSONB;

ALTER TABLE pages
  ADD COLUMN IF NOT EXISTS rotation_degrees INT;

-- Optional: constrain rotation to 0, 90, 180, 270
ALTER TABLE pages
  DROP CONSTRAINT IF EXISTS pages_rotation_degrees_check;
ALTER TABLE pages
  ADD CONSTRAINT pages_rotation_degrees_check CHECK (
    rotation_degrees IS NULL OR rotation_degrees IN (0, 90, 180, 270)
  );
