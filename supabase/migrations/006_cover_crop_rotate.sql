-- Cover crop and rotation for book editor (same semantics as pages).
-- Crop region: normalized 0-1 (x, y, width, height). Rotation: 0, 90, 180, 270.

ALTER TABLE covers
  ADD COLUMN IF NOT EXISTS crop_rect JSONB;

ALTER TABLE covers
  ADD COLUMN IF NOT EXISTS rotation_degrees INT;

ALTER TABLE covers
  DROP CONSTRAINT IF EXISTS covers_rotation_degrees_check;
ALTER TABLE covers
  ADD CONSTRAINT covers_rotation_degrees_check CHECK (
    rotation_degrees IS NULL OR rotation_degrees IN (0, 90, 180, 270)
  );
