import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminConversionsPage() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("saved_conversions")
    .select("id, user_id, conversion_context, provider, provider_cost_cents, conversion_error, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const conversions = data ?? [];
  const withCost = conversions.filter(
    (row) => typeof row.provider_cost_cents === "number",
  );
  const totalCostCents = withCost.reduce(
    (sum, row) => sum + (row.provider_cost_cents ?? 0),
    0,
  );

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Conversions / usage</h1>
        <p className="text-sm text-muted-foreground">
          Track provider split, failure rates, and conversion telemetry.
        </p>
      </header>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-md border p-3 text-sm">Total: {conversions.length}</div>
        <div className="rounded-md border p-3 text-sm">
          Gemini: {conversions.filter((x) => x.provider === "gemini").length}
        </div>
        <div className="rounded-md border p-3 text-sm">
          OpenAI: {conversions.filter((x) => x.provider === "openai").length}
        </div>
        <div className="rounded-md border p-3 text-sm">
          Failures: {conversions.filter((x) => !!x.conversion_error).length}
        </div>
        <div className="rounded-md border p-3 text-sm">
          Total Cost: ${(totalCostCents / 100).toFixed(2)}
        </div>
        <div className="rounded-md border p-3 text-sm">
          Avg Cost:{" "}
          {withCost.length
            ? `$${(totalCostCents / withCost.length / 100).toFixed(2)}`
            : "N/A"}
        </div>
        <div className="rounded-md border p-3 text-sm">
          Missing Cost: {conversions.length - withCost.length}
        </div>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="p-2">ID</th>
              <th className="p-2">User</th>
              <th className="p-2">Provider</th>
              <th className="p-2">Context</th>
              <th className="p-2">Cost</th>
              <th className="p-2">Error</th>
            </tr>
          </thead>
          <tbody>
            {conversions.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="p-2">{row.id.slice(0, 8)}</td>
                <td className="p-2 font-mono text-xs">
                  <Link className="underline" href={`/admin/users/${row.user_id}`}>
                    {row.user_id}
                  </Link>
                </td>
                <td className="p-2">{row.provider ?? "-"}</td>
                <td className="p-2">{row.conversion_context}</td>
                <td className="p-2">
                  {typeof row.provider_cost_cents === "number"
                    ? `$${(row.provider_cost_cents / 100).toFixed(2)}`
                    : "N/A"}
                </td>
                <td className="p-2">{row.conversion_error ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
