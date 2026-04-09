import { headers } from "next/headers";
import { AdminApiHealthClient } from "@/components/admin-api-health-client";

export const dynamic = "force-dynamic";

type ApiHealthState = "ok" | "degraded" | "down" | "skipped";

type ApiHealthResponse = {
  checkedAt: string;
  total: number;
  summary: Record<ApiHealthState, number>;
  checks: Array<{
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
  }>;
};

async function getInitialData(): Promise<ApiHealthResponse> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (!host) {
    throw new Error("Missing host header");
  }

  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const cookie = requestHeaders.get("cookie");
  const response = await fetch(`${protocol}://${host}/api/admin/api-health`, {
    cache: "no-store",
    headers: cookie ? { cookie } : undefined,
  });

  if (!response.ok) {
    throw new Error(`Unable to load API health data (${response.status})`);
  }

  return (await response.json()) as ApiHealthResponse;
}

export default async function AdminApiHealthPage() {
  const initialData = await getInitialData();
  return <AdminApiHealthClient initialData={initialData} />;
}

