import { createServerSupabaseClient } from "@/lib/supabase";
import { calculateBookPriceFromTrimCodeAsync } from "@/lib/pricing";
import { shippingFormToLuluCostAddress } from "@/lib/lulu";

export const dynamic = "force-dynamic";

function mapShippingLevel(input: string | null): "MAIL" | "PRIORITY_MAIL" | "EXPEDITED" {
  if (input === "PRIORITY_MAIL") return "PRIORITY_MAIL";
  if (input === "EXPEDITED" || input === "EXPRESS" || input === "GROUND") return "EXPEDITED";
  return "MAIL";
}

export default async function AdminEconomicsPage() {
  const supabase = createServerSupabaseClient();
  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, book_id, amount_total, shipping_level, shipping_country, shipping_state, shipping_city, shipping_postal_code, shipping_address_line1",
    )
    .order("created_at", { ascending: false })
    .limit(30);

  const rows = await Promise.all(
    (orders ?? []).map(async (order) => {
      const { data: book } = await supabase
        .from("books")
        .select("trim_size, page_count, page_tier")
        .eq("id", order.book_id)
        .single();
      if (!book?.trim_size || book.page_count == null) {
        return { order, pricing: null };
      }
      const pageTier = book.page_tier ?? 24;
      const result = await calculateBookPriceFromTrimCodeAsync(
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
      return { order, pricing: result.ok ? result.pricing : null };
    }),
  );

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Markups & economics</h1>
        <p className="text-sm text-muted-foreground">
          Compare charged totals against Lulu cost estimates and margin.
        </p>
      </header>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="p-2">Order</th>
              <th className="p-2">Charged</th>
              <th className="p-2">Lulu cost</th>
              <th className="p-2">Margin</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ order, pricing }) => (
              <tr key={order.id} className="border-t">
                <td className="p-2">{order.id.slice(0, 8)}</td>
                <td className="p-2">
                  {typeof order.amount_total === "number"
                    ? `$${(order.amount_total / 100).toFixed(2)}`
                    : "-"}
                </td>
                <td className="p-2">
                  {pricing ? `$${(pricing.luluTotalCostCents / 100).toFixed(2)}` : "-"}
                </td>
                <td className="p-2">
                  {pricing ? `$${(pricing.marginMarkupCents / 100).toFixed(2)}` : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
