import { NextResponse } from "next/server";
import {
  getPrintJobCostCalculation,
  getDefaultCostCalcAddress,
  isLuluSandbox,
  getLuluApiBaseUrl,
  getLuluCredentialDiagnostics,
} from "@/lib/lulu";
import { getPodPackageId } from "@/lib/book-products";
import {
  getBookMarkupPercent,
  getShippingMarkupPercent,
  computeCustomerPricingFromLuluCents,
} from "@/lib/pricing";

/**
 * Development only: verify Lulu keys and show sample cost + margin breakdown.
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
    const trimSizeId = "large" as const;
    const pageTier = 32;
    const shippingLevel = "MAIL" as const;
    const address = getDefaultCostCalcAddress();
    const podPackageId = getPodPackageId(trimSizeId, pageTier);

    const result = await getPrintJobCostCalculation({
      podPackageId,
      pageCount: pageTier,
      shippingOption: shippingLevel,
      shippingAddress: address,
    });

    const bookMarkupPercent = getBookMarkupPercent();
    const shippingMarkupPercent = getShippingMarkupPercent();
    const pricing = computeCustomerPricingFromLuluCents(
      result.lineItemCents,
      result.fulfillmentCents,
      result.shippingCents,
      bookMarkupPercent,
      shippingMarkupPercent
    );

    if (!pricing) {
      return NextResponse.json({
        ok: false,
        error: "Lulu returned zero or negative total cost.",
        keysSet: true,
        diagnostics,
        luluSandbox: diagnostics.luluUseSandbox,
        luluApiBaseUrl: getLuluApiBaseUrl(),
        sample: { trimSize: trimSizeId, pageTier, shippingLevel },
        luluCost: {
          lineItemCents: result.lineItemCents,
          fulfillmentCents: result.fulfillmentCents,
          shippingCents: result.shippingCents,
          totalCostCents:
            result.lineItemCents +
            result.fulfillmentCents +
            result.shippingCents,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      keysSet: true,
      diagnostics,
      luluSandbox: diagnostics.luluUseSandbox,
      luluApiBaseUrl: getLuluApiBaseUrl(),
      sample: {
        trimSize: trimSizeId,
        pageTier,
        shippingLevel,
      },
      luluCost: {
        lineItemCents: result.lineItemCents,
        fulfillmentCents: result.fulfillmentCents,
        shippingCents: result.shippingCents,
        totalCostCents: pricing.luluTotalCostCents,
      },
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
