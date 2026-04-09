"use client";

import { useMemo, useState } from "react";

type ApiHealthState = "ok" | "degraded" | "down" | "skipped";

type ApiHealthCheck = {
  id: string;
  method: string;
  pathPattern: string;
  category: string;
  expectedAuth: string;
  state: ApiHealthState;
  reason?: string;
  httpStatus?: number;
  latencyMs?: number;
  message?: string;
};

type ApiHealthResponse = {
  checkedAt: string;
  total: number;
  summary: Record<ApiHealthState, number>;
  checks: ApiHealthCheck[];
};

const CATEGORIES = [
  "all",
  "health",
  "admin",
  "public",
  "authenticated",
  "webhook",
  "cron",
  "dev",
] as const;

const STATES = ["all", "ok", "degraded", "down", "skipped"] as const;

function statePillClass(state: ApiHealthState): string {
  if (state === "ok") return "bg-emerald-500/10 text-emerald-700";
  if (state === "degraded") return "bg-amber-500/10 text-amber-700";
  if (state === "down") return "bg-rose-500/10 text-rose-700";
  return "bg-slate-500/10 text-slate-700";
}

export function AdminApiHealthClient({
  initialData,
}: {
  initialData: ApiHealthResponse;
}) {
  const [data, setData] = useState<ApiHealthResponse>(initialData);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("all");
  const [state, setState] = useState<(typeof STATES)[number]>("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return data.checks.filter((check) => {
      if (category !== "all" && check.category !== category) return false;
      if (state !== "all" && check.state !== state) return false;
      if (!query) return true;

      const search = query.toLowerCase();
      return (
        check.pathPattern.toLowerCase().includes(search) ||
        check.method.toLowerCase().includes(search) ||
        check.category.toLowerCase().includes(search) ||
        check.state.toLowerCase().includes(search)
      );
    });
  }, [category, data.checks, query, state]);

  async function refresh(): Promise<void> {
    setLoading(true);
    setRefreshError(null);
    try {
      const response = await fetch("/api/admin/api-health", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Refresh failed with status ${response.status}`);
      }
      const next = (await response.json()) as ApiHealthResponse;
      setData(next);
    } catch (error) {
      setRefreshError(error instanceof Error ? error.message : "Refresh failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">API health</h1>
            <p className="text-sm text-muted-foreground">
              Safe GET probes for endpoint status. Side-effectful routes are listed as skipped.
            </p>
          </div>
          <button
            className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-60"
            disabled={loading}
            onClick={refresh}
            type="button"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Last checked: {new Date(data.checkedAt).toLocaleString()}
        </p>
        {refreshError ? <p className="text-xs text-rose-700">{refreshError}</p> : null}
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <div className="rounded-md border p-3 text-sm">Total: {data.total}</div>
        <div className="rounded-md border p-3 text-sm">OK: {data.summary.ok}</div>
        <div className="rounded-md border p-3 text-sm">Degraded: {data.summary.degraded}</div>
        <div className="rounded-md border p-3 text-sm">Down: {data.summary.down}</div>
        <div className="rounded-md border p-3 text-sm">Skipped: {data.summary.skipped}</div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-sm">
          Category
          <select
            className="mt-1 w-full rounded-md border bg-background p-2"
            onChange={(event) =>
              setCategory(event.target.value as (typeof CATEGORIES)[number])
            }
            value={category}
          >
            {CATEGORIES.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          State
          <select
            className="mt-1 w-full rounded-md border bg-background p-2"
            onChange={(event) => setState(event.target.value as (typeof STATES)[number])}
            value={state}
          >
            {STATES.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Search
          <input
            className="mt-1 w-full rounded-md border bg-background p-2"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by path, method, category..."
            value={query}
          />
        </label>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="p-2">Endpoint</th>
              <th className="p-2">Category</th>
              <th className="p-2">Auth</th>
              <th className="p-2">State</th>
              <th className="p-2">HTTP</th>
              <th className="p-2">Latency</th>
              <th className="p-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((check) => (
              <tr key={check.id} className="border-t align-top">
                <td className="p-2 font-mono text-xs">
                  <span className="mr-2 rounded bg-muted px-1.5 py-0.5 text-[11px] font-semibold">
                    {check.method}
                  </span>
                  {check.pathPattern}
                </td>
                <td className="p-2">{check.category}</td>
                <td className="p-2">{check.expectedAuth}</td>
                <td className="p-2">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${statePillClass(check.state)}`}>
                    {check.state}
                  </span>
                </td>
                <td className="p-2">{check.httpStatus ?? "-"}</td>
                <td className="p-2">
                  {typeof check.latencyMs === "number" ? `${check.latencyMs}ms` : "-"}
                </td>
                <td className="p-2 text-muted-foreground">
                  {check.reason ?? check.message ?? "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

