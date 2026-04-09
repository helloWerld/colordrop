import Link from "next/link";
import { luluDashboardPrintJobLink } from "@/lib/lulu";
import { stripeDashboardPaymentDeepLink } from "@/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "id, status, lulu_status, amount_total, stripe_checkout_session_id, stripe_payment_intent_id, lulu_print_job_id, shipping_name, shipping_country, error_message, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <p className="text-sm text-muted-foreground">
          End-to-end order operations with payment, shipping, and print status.
        </p>
      </header>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="p-2">Order</th>
              <th className="p-2">Status</th>
              <th className="p-2">Stripe Session</th>
              <th className="p-2">Lulu Job</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Ship To</th>
              <th className="p-2">Error</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((row) => (
              <tr key={row.id} className="border-t">
                <td className="p-2">
                  <Link className="underline" href={`/admin/orders/${row.id}`}>
                    {row.id.slice(0, 8)}
                  </Link>
                </td>
                <td className="p-2">
                  {row.status}
                  {row.lulu_status ? ` (${row.lulu_status})` : ""}
                </td>
                <td className="p-2 font-mono text-xs">
                  {(() => {
                    const sid = row.stripe_checkout_session_id;
                    if (!sid) return "-";
                    const href = stripeDashboardPaymentDeepLink({
                      checkoutSessionId: sid,
                      paymentIntentId: row.stripe_payment_intent_id,
                    });
                    return href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline break-all"
                      >
                        {sid}
                      </a>
                    ) : (
                      sid
                    );
                  })()}
                </td>
                <td className="p-2">
                  {(() => {
                    const jobId = row.lulu_print_job_id;
                    if (!jobId) return "-";
                    const href = luluDashboardPrintJobLink(jobId);
                    return href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {jobId}
                      </a>
                    ) : (
                      jobId
                    );
                  })()}
                </td>
                <td className="p-2">
                  {typeof row.amount_total === "number" ? `$${(row.amount_total / 100).toFixed(2)}` : "-"}
                </td>
                <td className="p-2">
                  {row.shipping_name ?? "-"} {row.shipping_country ?? ""}
                </td>
                <td className="p-2">{row.error_message ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
