import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { API_ENDPOINT_REGISTRY } from "@/lib/api-endpoints-registry";

type ApiHealthState = "ok" | "degraded" | "down" | "skipped";

type ApiHealthResult = {
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

function toTimeoutMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Probe failed";
}

async function probeEndpoint(
  input: string,
  method: string,
  cookieHeader: string | null,
): Promise<{ httpStatus: number; latencyMs: number }> {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(input, {
      method,
      cache: "no-store",
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      signal: controller.signal,
    });
    return { httpStatus: response.status, latencyMs: Date.now() - startedAt };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: Request) {
  const admin = await requireAdminApi();
  if (admin instanceof NextResponse) return admin;

  const origin = new URL(request.url).origin;
  const cookieHeader = request.headers.get("cookie");

  const checks = await Promise.all(
    API_ENDPOINT_REGISTRY.map(async (endpoint): Promise<ApiHealthResult> => {
      if (!endpoint.probePolicy.probe) {
        return {
          id: endpoint.id,
          method: endpoint.method,
          pathPattern: endpoint.pathPattern,
          category: endpoint.category,
          expectedAuth: endpoint.expectedAuth,
          state: "skipped",
          reason: endpoint.probePolicy.reason,
          message: "Probe skipped by policy",
        };
      }

      try {
        const probe = await probeEndpoint(
          new URL(endpoint.pathPattern, origin).toString(),
          endpoint.method,
          cookieHeader,
        );
        const isExpected = endpoint.probePolicy.expectedStatuses.includes(
          probe.httpStatus,
        );

        if (isExpected) {
          return {
            id: endpoint.id,
            method: endpoint.method,
            pathPattern: endpoint.pathPattern,
            category: endpoint.category,
            expectedAuth: endpoint.expectedAuth,
            state: "ok",
            httpStatus: probe.httpStatus,
            latencyMs: probe.latencyMs,
          };
        }

        return {
          id: endpoint.id,
          method: endpoint.method,
          pathPattern: endpoint.pathPattern,
          category: endpoint.category,
          expectedAuth: endpoint.expectedAuth,
          state: probe.httpStatus >= 500 ? "down" : "degraded",
          httpStatus: probe.httpStatus,
          latencyMs: probe.latencyMs,
          message: `Unexpected status ${probe.httpStatus}`,
        };
      } catch (error) {
        return {
          id: endpoint.id,
          method: endpoint.method,
          pathPattern: endpoint.pathPattern,
          category: endpoint.category,
          expectedAuth: endpoint.expectedAuth,
          state: "down",
          message: toTimeoutMessage(error),
        };
      }
    }),
  );

  const summary = checks.reduce(
    (acc, result) => {
      acc[result.state] += 1;
      return acc;
    },
    { ok: 0, degraded: 0, down: 0, skipped: 0 },
  );

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    total: checks.length,
    summary,
    checks,
  });
}

