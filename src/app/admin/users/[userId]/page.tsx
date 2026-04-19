import Link from "next/link";
import { notFound } from "next/navigation";
import { luluDashboardPrintJobLink } from "@/lib/lulu";
import { stripeDashboardPaymentDeepLink } from "@/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getAdminUserCockpitData } from "@/lib/admin-user-cockpit";
import { AdminGrantFreeCreditsForm } from "./grant-free-credits-form";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = createServerSupabaseClient();

  let data: Awaited<ReturnType<typeof getAdminUserCockpitData>>;
  try {
    data = await getAdminUserCockpitData(supabase, userId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === "USER_NOT_FOUND") notFound();
    throw error;
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <Link
          href="/admin/users"
          className="text-xs text-muted-foreground underline"
        >
          Back to users
        </Link>
        <h1 className="text-2xl font-semibold">User Details</h1>
        <div className="rounded-md border p-3 text-sm">
          <p>
            <span className="font-medium">User ID:</span>{" "}
            <span className="font-mono text-xs">{data.user.user_id}</span>
          </p>
          <p>
            <span className="font-medium">Email:</span> {data.user.email ?? "-"}
          </p>
          <p>
            <span className="font-medium">Free credits:</span>{" "}
            {data.user.free_conversions_remaining}
          </p>
          <p>
            <span className="font-medium">Paid credits:</span>{" "}
            {data.user.paid_credits}
          </p>
          <AdminGrantFreeCreditsForm userId={data.user.user_id} />
        </div>
      </header>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Orders</h2>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="p-2">Order</th>
                <th className="p-2">Status</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Stripe</th>
                <th className="p-2">Lulu</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map((order) => (
                <tr key={String(order.id)} className="border-t">
                  <td className="p-2 font-mono text-xs">
                    <Link
                      className="underline"
                      href={`/admin/orders/${String(order.id)}`}
                    >
                      {String(order.id).slice(0, 8)}
                    </Link>
                  </td>
                  <td className="p-2">
                    {String(order.status)}
                    {order.lulu_status ? ` (${String(order.lulu_status)})` : ""}
                  </td>
                  <td className="p-2">
                    {typeof order.amount_total === "number"
                      ? `$${(order.amount_total / 100).toFixed(2)}`
                      : "-"}
                  </td>
                  <td className="p-2 font-mono text-xs">
                    {(() => {
                      const sid = order.stripe_checkout_session_id;
                      if (typeof sid !== "string" || !sid) return "-";
                      const href = stripeDashboardPaymentDeepLink({
                        checkoutSessionId: sid,
                        paymentIntentId:
                          typeof order.stripe_payment_intent_id === "string"
                            ? order.stripe_payment_intent_id
                            : null,
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
                      const jobId = order.lulu_print_job_id;
                      if (typeof jobId !== "number") return "-";
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Books</h2>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="p-2">Book</th>
                <th className="p-2">Status</th>
                <th className="p-2">Trim</th>
                <th className="p-2">Pages</th>
                <th className="p-2">Cover</th>
              </tr>
            </thead>
            <tbody>
              {data.books.map((book) => (
                <tr key={String(book.id)} className="border-t">
                  <td className="p-2">{String(book.title ?? "Untitled")}</td>
                  <td className="p-2">{String(book.status ?? "-")}</td>
                  <td className="p-2">{String(book.trim_size ?? "-")}</td>
                  <td className="p-2">{String(book.pages_count ?? 0)}</td>
                  <td className="p-2">{book.has_cover ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Conversions</h2>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="p-2">ID</th>
                <th className="p-2">Provider</th>
                <th className="p-2">Context</th>
                <th className="p-2">Cost</th>
                <th className="p-2">Error</th>
              </tr>
            </thead>
            <tbody>
              {data.conversions.map((conversion) => (
                <tr key={String(conversion.id)} className="border-t">
                  <td className="p-2 font-mono text-xs">
                    {String(conversion.id).slice(0, 8)}
                  </td>
                  <td className="p-2">{String(conversion.provider ?? "-")}</td>
                  <td className="p-2">
                    {String(conversion.conversion_context ?? "-")}
                  </td>
                  <td className="p-2">
                    {typeof conversion.provider_cost_cents === "number"
                      ? `$${(conversion.provider_cost_cents / 100).toFixed(2)}`
                      : "-"}
                  </td>
                  <td className="p-2">
                    {String(conversion.conversion_error ?? "-")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Content previews</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {data.content.slice(0, 12).map((item) => (
            <div
              key={String(item.id)}
              className="rounded-md border p-2 text-xs"
            >
              <p className="mb-2 font-mono">{String(item.id).slice(0, 8)}</p>
              <div className="space-y-1">
                <a
                  className="block underline"
                  href={String(item.original_url ?? "#")}
                  target="_blank"
                  rel="noreferrer"
                >
                  Original image
                </a>
                <a
                  className="block underline"
                  href={String(item.outline_url ?? "#")}
                  target="_blank"
                  rel="noreferrer"
                >
                  Outline image
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Integration events</h2>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="p-2">Time</th>
                <th className="p-2">Provider</th>
                <th className="p-2">Event</th>
                <th className="p-2">Severity</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.events.map((event) => (
                <tr key={String(event.id)} className="border-t">
                  <td className="p-2">
                    {new Date(String(event.created_at)).toLocaleString()}
                  </td>
                  <td className="p-2">{String(event.provider)}</td>
                  <td className="p-2">{String(event.event_type)}</td>
                  <td className="p-2">{String(event.severity ?? "-")}</td>
                  <td className="p-2">{String(event.status ?? "-")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
