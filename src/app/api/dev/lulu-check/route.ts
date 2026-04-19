import { NextResponse } from "next/server";
import {
  getDefaultCostCalcAddress,
  isLuluSandbox,
  getLuluApiBaseUrl,
  getLuluCredentialDiagnostics,
} from "@/lib/lulu";
import { BOOK_PRODUCTS } from "@/lib/book-products";
import { calculateBookPriceFromTrimCodeAsync } from "@/lib/pricing";

/** Same sample as the Lulu dev popover (“large, 32p, MAIL”). */
const SAMPLE_TRIM_SIZE_ID = "large" as const;
const SAMPLE_PAGE_TIER = 32;
const SAMPLE_SHIPPING_LEVEL = "MAIL" as const;

/**
 * Development only: verify Lulu keys and show sample cost + margin breakdown.
 * Uses the same pricing path as checkout and `/api/books/.../price`.
 * GET /api/dev/lulu-check
 */
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const diagnostics = getLuluCredentialDiagnostics();
  const { activeKeysSet, hint } = diagnostics;
  if (!activeKeysSet) {
    const error =
      !diagnostics.prodKeysSet && !diagnostics.sandboxKeysSet
        ? "No Lulu credentials: set LULU_CLIENT_KEY / LULU_CLIENT_SECRET, or sandbox keys with LULU_USE_SANDBOX=true."
        : diagnostics.sandboxKeysSet && !diagnostics.prodKeysSet
          ? "LULU_CLIENT_KEY and LULU_CLIENT_SECRET are not set; set LULU_USE_SANDBOX=true to use sandbox keys only."
          : "LULU_CLIENT_KEY and LULU_CLIENT_SECRET are not set";
    return NextResponse.json({
      ok: false,
      error,
      keysSet: false,
      luluSandbox: diagnostics.luluUseSandbox,
      luluApiBaseUrl: getLuluApiBaseUrl(),
      diagnostics,
      ...(hint ? { hint } : {}),
    });
  }

  try {
    const address = getDefaultCostCalcAddress();
    const trimCode = BOOK_PRODUCTS[SAMPLE_TRIM_SIZE_ID].trimCode;
    const priceResult = await calculateBookPriceFromTrimCodeAsync(
      trimCode,
      SAMPLE_PAGE_TIER,
      SAMPLE_SHIPPING_LEVEL,
      address
    );

    if (!priceResult.ok) {
      return NextResponse.json({
        ok: false,
        error: priceResult.error,
        keysSet: true,
        diagnostics,
        luluSandbox: diagnostics.luluUseSandbox,
        luluApiBaseUrl: getLuluApiBaseUrl(),
        sample: {
          trimSize: SAMPLE_TRIM_SIZE_ID,
          pageTier: SAMPLE_PAGE_TIER,
          shippingLevel: SAMPLE_SHIPPING_LEVEL,
        },
        ...(hint ? { hint } : {}),
      });
    }

    const { pricing, printingOnlyCents } = priceResult;
    return NextResponse.json({
      ok: true,
      keysSet: true,
      diagnostics,
      luluSandbox: diagnostics.luluUseSandbox,
      luluApiBaseUrl: getLuluApiBaseUrl(),
      sample: {
        trimSize: SAMPLE_TRIM_SIZE_ID,
        pageTier: SAMPLE_PAGE_TIER,
        shippingLevel: SAMPLE_SHIPPING_LEVEL,
      },
      luluCost: {
        lineItemCents: pricing.luluLineItemCents,
        fulfillmentCents: pricing.luluFulfillmentCents,
        shippingCents: pricing.luluShippingCents,
        totalCostCents: pricing.luluTotalCostCents,
      },
      printingOnlyCents,
      bookMarkupPercent: pricing.bookMarkupPercent,
      shippingMarkupPercent: pricing.shippingMarkupPercent,
      marginMarkupCents: pricing.marginMarkupCents,
      customer: {
        bookCents: pricing.bookCents,
        shippingCents: pricing.shippingCents,
        totalCents: pricing.totalCents,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const diag = getLuluCredentialDiagnostics();
    return NextResponse.json({
      ok: false,
      error: message,
      keysSet: true,
      diagnostics: diag,
      ...(diag.hint ? { hint: diag.hint } : {}),
      luluSandbox: isLuluSandbox(),
      luluApiBaseUrl: getLuluApiBaseUrl(),
    });
  }
}
