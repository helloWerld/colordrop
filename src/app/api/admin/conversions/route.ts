import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const admin = await requireAdminApi();
  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "100"), 200);

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("saved_conversions")
    .select(
      "id, user_id, conversion_context, provider, provider_cost_cents, conversion_error, original_image_path, outline_image_path, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const conversions = data ?? [];
  const withCost = conversions.filter(
    (row) => typeof row.provider_cost_cents === "number",
  );
  const totalCostCents = withCost.reduce(
    (sum, row) => sum + (row.provider_cost_cents ?? 0),
    0,
  );
  const openAICostCents = conversions
    .filter(
      (row) =>
        row.provider === "openai" && typeof row.provider_cost_cents === "number",
    )
    .reduce((sum, row) => sum + (row.provider_cost_cents ?? 0), 0);
  const geminiCostCents = conversions
    .filter(
      (row) =>
        row.provider === "gemini" && typeof row.provider_cost_cents === "number",
    )
    .reduce((sum, row) => sum + (row.provider_cost_cents ?? 0), 0);

  const summary = {
    total: conversions.length,
    failures: conversions.filter((row) => !!row.conversion_error).length,
    gemini: conversions.filter((row) => row.provider === "gemini").length,
    openai: conversions.filter((row) => row.provider === "openai").length,
    totalCostCents,
    avgCostCents: withCost.length
      ? Math.round(totalCostCents / withCost.length)
      : null,
    missingCostCount: conversions.length - withCost.length,
    costByProviderCents: {
      gemini: geminiCostCents,
      openai: openAICostCents,
    },
  };

  return NextResponse.json({ summary, conversions });
}
