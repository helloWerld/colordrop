import { NextResponse } from "next/server";
import { isLuluSandbox } from "@/lib/lulu";
import { isStripeTestMode } from "@/lib/stripe";

/**
 * GET /api/config
 * Returns client-safe config (e.g. Lulu sandbox mode) for banners and UI.
 */
export async function GET() {
  return NextResponse.json({
    luluSandbox: isLuluSandbox(),
    stripeTestMode: isStripeTestMode(),
  });
}
