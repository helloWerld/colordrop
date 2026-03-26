import { NextResponse } from "next/server";
import {
  calculateBookPriceFromTrimCodeAsync,
  SHIPPING_LEVELS,
} from "@/lib/pricing";
import { isLuluSandbox } from "@/lib/lulu";
import {
  getProductByTrimSizeId,
  isPageTier,
  isTrimSizeId,
  PAGE_TIERS,
} from "@/lib/book-products";
import type { ShippingLevelId } from "@/lib/pricing";

const SHIPPING_LEVEL_IDS: ShippingLevelId[] = [
  "MAIL",
  "PRIORITY_MAIL",
  "EXPEDITED",
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const trimSizeId = searchParams.get("trim_size_id") ?? "";
  const pageTierParam = searchParams.get("page_tier");
  const shippingLevel = (searchParams.get("shipping_level") ?? "MAIL") as ShippingLevelId;

  if (!isTrimSizeId(trimSizeId)) {
    return NextResponse.json(
      { error: "Invalid trim_size_id. Use pocket, medium, or large." },
      { status: 400 }
    );
  }

  const pageTier = pageTierParam != null ? parseInt(pageTierParam, 10) : 24;
  if (!Number.isInteger(pageTier) || !isPageTier(pageTier)) {
    return NextResponse.json(
      { error: `Invalid page_tier. Use one of: ${PAGE_TIERS.join(", ")}.` },
      { status: 400 }
    );
  }

  if (!SHIPPING_LEVEL_IDS.includes(shippingLevel)) {
    return NextResponse.json(
      {
        error:
          "Invalid shipping_level. Use MAIL, PRIORITY_MAIL, or EXPEDITED.",
      },
      { status: 400 }
    );
  }

  const product = getProductByTrimSizeId(trimSizeId);
  const trimCode = product.trimCode;

  const result = await calculateBookPriceFromTrimCodeAsync(
    trimCode,
    pageTier,
    shippingLevel
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        error:
          "Pricing is temporarily unavailable. Try reloading the page or contact support.",
        detail: result.error,
      },
      { status: 503 }
    );
  }

  const { pricing } = result;
  return NextResponse.json({
    bookCents: pricing.bookCents,
    shippingCents: pricing.shippingCents,
    totalCents: pricing.totalCents,
    luluLineItemCents: pricing.luluLineItemCents,
    luluFulfillmentCents: pricing.luluFulfillmentCents,
    luluShippingCents: pricing.luluShippingCents,
    luluTotalCostCents: pricing.luluTotalCostCents,
    bookMarkupPercent: pricing.bookMarkupPercent,
    shippingMarkupPercent: pricing.shippingMarkupPercent,
    marginMarkupCents: pricing.marginMarkupCents,
    shipping_options: SHIPPING_LEVELS,
    luluSandbox: isLuluSandbox(),
  });
}
