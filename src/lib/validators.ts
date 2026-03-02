import imageSize from "image-size";
import { z } from "zod";

export const stylizationEnum = z.enum([
  "none",
  "fairy_tale",
  "cartoon",
  "storybook",
  "sketch",
]);
export type Stylization = z.infer<typeof stylizationEnum>;

export const conversionContextEnum = z.enum(["one_off", "book"]);
export type ConversionContext = z.infer<typeof conversionContextEnum>;

export const convertBodySchema = z.object({
  storage_path: z.string().min(1),
  stylization: stylizationEnum,
  conversion_context: conversionContextEnum,
  book_id: z.string().uuid().optional(),
});

export const uuidSchema = z.string().uuid();

export const shippingLevelEnum = z.enum([
  "MAIL",
  "PRIORITY_MAIL",
  "EXPEDITED",
  "GROUND",
  "EXPRESS",
]);

export const shippingAddressSchema = z.object({
  name: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postal_code: z.string().min(1),
  country: z.string().length(2),
  phone: z.string().min(1),
});

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB
export const MIN_DIMENSION = 800;

/**
 * Validate image dimensions (min 800x800). Returns error message or null if valid.
 * PRD §4.2.
 */
export function validateImageDimensions(buffer: Buffer): string | null {
  try {
    const dims = imageSize(buffer);
    if (!dims?.width || !dims.height) return "Could not read image dimensions.";
    if (dims.width < MIN_DIMENSION || dims.height < MIN_DIMENSION) {
      return `Image must be at least ${MIN_DIMENSION}×${MIN_DIMENSION} pixels. This image is ${dims.width}×${dims.height}.`;
    }
    return null;
  } catch {
    return "Could not read image dimensions.";
  }
}
