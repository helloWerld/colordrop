import { createServerSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("integration_events")
    .select("id, provider, event_type, severity, status, order_id, error_message, payload, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Custom logging (Stripe + Lulu)</h1>
        <p className="text-sm text-muted-foreground">
          Searchable provider events for webhook, fulfillment, and error triage.
        </p>
      </header>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="p-2">Time</th>
              <th className="p-2">Provider</th>
              <th className="p-2">Event</th>
              <th className="p-2">Severity</th>
              <th className="p-2">Order</th>
              <th className="p-2">Status</th>
              <th className="p-2">Error</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((row) => {
              const payload =
                row.payload && typeof row.payload === "object"
                  ? (row.payload as Record<string, unknown>)
                  : null;
              const isAdminCreditGrant = row.event_type === "admin.free_credits_granted";
              const details = isAdminCreditGrant
                ? [
                    payload?.adminEmail
                      ? `actor: ${String(payload.adminEmail)}`
                      : payload?.adminUserId
                        ? `actor: ${String(payload.adminUserId)}`
                        : null,
                    payload?.targetUserId
                      ? `target: ${String(payload.targetUserId)}`
                      : null,
                    payload?.creditsAdded !== undefined
                      ? `added: ${String(payload.creditsAdded)}`
                      : null,
                    payload?.reason
                      ? `reason: ${String(payload.reason)}`
                      : null,
                  ]
                    .filter((v): v is string => Boolean(v))
                    .join(" | ")
                : null;

              return (
                <tr key={row.id} className="border-t">
                  <td className="p-2">{new Date(row.created_at).toLocaleString()}</td>
                  <td className="p-2">{row.provider}</td>
                  <td className="p-2">
                    <div>{row.event_type}</div>
                    {details ? (
                      <div className="mt-1 text-xs text-muted-foreground">{details}</div>
                    ) : null}
                  </td>
                  <td className="p-2">{row.severity}</td>
                  <td className="p-2">{row.order_id ?? "-"}</td>
                  <td className="p-2">{row.status ?? "-"}</td>
                  <td className="p-2">{row.error_message ?? "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
