import { NextResponse } from "next/server";
import { getLuluApiBaseUrl, getLuluCredentialDiagnostics } from "@/lib/lulu";

function maskSecret(value: string | undefined): string {
  if (!value) return "—";
  const t = value.trim();
  if (t.length === 0) return "—";
  if (t.length <= 8) return "••••••••";
  return `${t.slice(0, 4)}…${t.slice(-4)}`;
}

/**
 * GET /api/dev/lulu-debug
 * Development only: Lulu mode, base URL, and masked credential previews.
 */
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const diagnostics = getLuluCredentialDiagnostics();
  const prodKey = process.env.LULU_CLIENT_KEY;
  const prodSecret = process.env.LULU_CLIENT_SECRET;
  const sandKey = process.env.LULU_SANDBOX_CLIENT_KEY;
  const sandSecret = process.env.LULU_SANDBOX_CLIENT_SECRET;

  const active = diagnostics.luluUseSandbox
    ? {
        keyEnv: "LULU_SANDBOX_CLIENT_KEY" as const,
        keyMasked: maskSecret(sandKey),
        secretEnv: "LULU_SANDBOX_CLIENT_SECRET" as const,
        secretMasked: maskSecret(sandSecret),
      }
    : {
        keyEnv: "LULU_CLIENT_KEY" as const,
        keyMasked: maskSecret(prodKey),
        secretEnv: "LULU_CLIENT_SECRET" as const,
        secretMasked: maskSecret(prodSecret),
      };

  return NextResponse.json({
    diagnostics,
    apiBaseUrl: getLuluApiBaseUrl(),
    activeCredentials: active,
    production: {
      bothSet: !!(prodKey && prodSecret),
      keyMasked: maskSecret(prodKey),
      secretMasked: maskSecret(prodSecret),
    },
    sandbox: {
      bothSet: !!(sandKey && sandSecret),
      keyMasked: maskSecret(sandKey),
      secretMasked: maskSecret(sandSecret),
    },
  });
}
