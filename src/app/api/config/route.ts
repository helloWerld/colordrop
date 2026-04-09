import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { isLuluSandbox } from "@/lib/lulu";
import { isStripeTestMode } from "@/lib/stripe";

/**
 * GET /api/config
 * Admin-only: sandbox/test flags for internal tooling. Not used by public client bundles.
 */
export async function GET() {
  const admin = await requireAdminApi();
  if (admin instanceof NextResponse) return admin;

  return NextResponse.json({
    luluSandbox: isLuluSandbox(),
    stripeTestMode: isStripeTestMode(),
  });
}
