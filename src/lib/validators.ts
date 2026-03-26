import imageSize from "image-size";
import { z } from "zod";
import {
  CA_PROVINCE_CODES,
  SHIPPING_COUNTRY_CODES,
  US_CHECKOUT_STATE_CODES,
} from "./shipping-regions";
import { normalizeUsStateCodeForLulu } from "./us-state";

export const conversionContextEnum = z.enum(["one_off", "book"]);
export type ConversionContext = z.infer<typeof conversionContextEnum>;

export const convertBodySchema = z.object({
  storage_path: z.string().min(1),
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

const shippingCountrySchema = z.enum(SHIPPING_COUNTRY_CODES);

const shippingAddressBaseSchema = z.object({
  name: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postal_code: z.string().min(1),
  country: shippingCountrySchema,
  phone: z.string().min(1),
});

type AddressShape = { country: string; state: string; [k: string]: unknown };

function withShippingRegionNormalization<T extends z.ZodObject<z.ZodRawShape>>(
  schema: T
) {
  return schema
    .superRefine((val, ctx) => {
      const v = val as AddressShape;
      const state = v.state.trim().toUpperCase();
      if (!state) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select a state or province.",
          path: ["state"],
        });
        return;
      }
      if (v.country === "US") {
        if (!US_CHECKOUT_STATE_CODES.has(state)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Select a valid US state or territory.",
            path: ["state"],
          });
        }
      } else if (v.country === "CA") {
        if (!CA_PROVINCE_CODES.has(state)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Select a valid Canadian province or territory.",
            path: ["state"],
          });
        }
      }
    })
    .transform((val) => {
      const v = val as AddressShape;
      const state = v.state.trim().toUpperCase();
      if (v.country === "US") {
        const normalized = normalizeUsStateCodeForLulu(state);
        return { ...val, state: normalized ?? state };
      }
      return { ...val, state };
    });
}

export const shippingAddressSchema = withShippingRegionNormalization(
  shippingAddressBaseSchema
);

/** POST /api/books/[bookId]/price body: address fields + shipping_level */
export const bookPricePostSchema = withShippingRegionNormalization(
  shippingAddressBaseSchema.extend({
    shipping_level: z.enum(["MAIL", "PRIORITY_MAIL", "EXPEDITED"]),
  })
);

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
export type BookPricePostInput = z.infer<typeof bookPricePostSchema>;

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
