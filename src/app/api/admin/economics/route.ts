import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { calculateBookPriceFromTrimCodeAsync } from "@/lib/pricing";
import { shippingFormToLuluCostAddress } from "@/lib/lulu";

function mapShippingLevel(input: string | null): "MAIL" | "PRIORITY_MAIL" | "EXPEDITED" {
  if (input === "PRIORITY_MAIL") return "PRIORITY_MAIL";
  if (input === "EXPEDITED" || input === "EXPRESS" || input === "GROUND") {
    return "EXPEDITED";
  }
  return "MAIL";
}

export async function GET() {
  const admin = await requireAdminApi();
  if (admin instanceof NextResponse) return admin;

  const supabase = createServerSupabaseClient();
  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      "id, book_id, amount_total, shipping_level, shipping_country, shipping_state, shipping_city, shipping_postal_code, shipping_address_line1",
    )
    .in("status", ["paid", "processing", "submitted_to_print", "in_production", "shipped", "delivered"])
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = await Promise.all(
    (orders ?? []).map(async (order) => {
      const { data: book } = await supabase
        .from("books")
        .select("trim_size, page_count, page_tier")
        .eq("id", order.book_id)
        .single();
      if (!book?.trim_size || book.page_count == null) {
        return { ...order, estimated: null };
      }
      const pageTier = book.page_tier ?? 24;
      const priceResult = await calculateBookPriceFromTrimCodeAsync(
        book.trim_size,
        pageTier,
        mapShippingLevel(order.shipping_level),
        shippingFormToLuluCostAddress({
          name: "Customer",
          line1: order.shipping_address_line1 ?? "",
          city: order.shipping_city ?? "",
          state: order.shipping_state ?? "",
          postal_code: order.shipping_postal_code ?? "",
          country: order.shipping_country ?? "US",
          phone: "0000000000",
        }),
      );
      if (!priceResult.ok) {
        return { ...order, estimated: null };
      }
      const { pricing } = priceResult;
      return {
        ...order,
        estimated: {
          customerPriceCents: pricing.totalCents,
          luluCostCents: pricing.luluTotalCostCents,
          marginCents: pricing.marginMarkupCents,
          shippingCustomerCents: pricing.shippingCents,
          shippingLuluCents: pricing.luluShippingCents,
        },
      };
    }),
  );
  return NextResponse.json({ economics: rows });
}
