import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getStripe, stripeUseSandbox } from "@/lib/stripe";
import { getLuluCredentialDiagnostics, luluHealthCheck } from "@/lib/lulu";
import { checkProductionEnv } from "@/lib/production-env-check";

type CheckResult =
  | { ok: true; latencyMs: number }
  | { ok: false; latencyMs: number; error: string };

function nowMs(): number {
  return Date.now();
}

async function withTimeout<T>(
  label: string,
  ms: number,
  fn: () => Promise<T>,
): Promise<{ ok: true; value: T; latencyMs: number } | { ok: false; latencyMs: number; error: string }> {
  const start = nowMs();
  try {
    const value = await Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
      ),
    ]);
    return { ok: true, value, latencyMs: nowMs() - start };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, latencyMs: nowMs() - start, error: message };
  }
}

function getMissingCriticalEnv(): string[] {
  const missing: string[] = [];
  const isProd = process.env.NODE_ENV === "production";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!supabaseKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");

  // Stripe: require whichever mode is active.
  if (stripeUseSandbox()) {
    if (!process.env.STRIPE_SANDBOX_SECRET_KEY) missing.push("STRIPE_SANDBOX_SECRET_KEY");
    if (isProd && !process.env.STRIPE_SANDBOX_WEBHOOK_SECRET) {
      missing.push("STRIPE_SANDBOX_WEBHOOK_SECRET");
    }
  } else {
    if (!process.env.STRIPE_SECRET_KEY) missing.push("STRIPE_SECRET_KEY");
    if (isProd && !process.env.STRIPE_WEBHOOK_SECRET) {
      missing.push("STRIPE_WEBHOOK_SECRET");
    }
  }

  // Lulu: require active mode keys (mode depends on LULU_USE_SANDBOX and whether sandbox creds are present).
  const luluDiag = getLuluCredentialDiagnostics();
  if (!luluDiag.activeKeysSet) {
    if (luluDiag.activeMode === "sandbox") {
      if (!process.env.LULU_SANDBOX_CLIENT_KEY) missing.push("LULU_SANDBOX_CLIENT_KEY");
      if (!process.env.LULU_SANDBOX_CLIENT_SECRET) missing.push("LULU_SANDBOX_CLIENT_SECRET");
    } else {
      if (!process.env.LULU_CLIENT_KEY) missing.push("LULU_CLIENT_KEY");
      if (!process.env.LULU_CLIENT_SECRET) missing.push("LULU_CLIENT_SECRET");
    }
  }

  if (isProd && !process.env.LULU_WEBHOOK_SECRET) {
    missing.push("LULU_WEBHOOK_SECRET");
  }

  if (isProd && !process.env.CRON_SECRET) {
    missing.push("CRON_SECRET");
  }

  return missing;
}

async function checkSupabase(): Promise<CheckResult> {
  const result = await withTimeout("supabase", 2500, async () => {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from("orders").select("id").limit(1);
    if (error) throw new Error(error.message);
    return true;
  });
  if (!result.ok) return { ok: false, latencyMs: result.latencyMs, error: result.error };
  return { ok: true, latencyMs: result.latencyMs };
}

async function checkStripe(): Promise<CheckResult> {
  const result = await withTimeout("stripe", 2500, async () => {
    const stripe = getStripe();
    await stripe.balance.retrieve();
    return true;
  });
  if (!result.ok) return { ok: false, latencyMs: result.latencyMs, error: result.error };
  return { ok: true, latencyMs: result.latencyMs };
}

async function checkLulu(): Promise<CheckResult> {
  const result = await withTimeout("lulu", 2500, async () => {
    const res = await luluHealthCheck();
    if (!res.ok) throw new Error(res.error);
    return true;
  });
  if (!result.ok) return { ok: false, latencyMs: result.latencyMs, error: result.error };
  return { ok: true, latencyMs: result.latencyMs };
}

export async function GET() {
  const timestamp = new Date().toISOString();
  const missing = getMissingCriticalEnv();

  const prodReadiness = checkProductionEnv();
  const warnings = prodReadiness.warnings;

  const base = {
    timestamp,
    warnings,
    checks: {
      env: {
        ok: missing.length === 0,
        missing: missing.length ? missing : undefined,
      },
    } as Record<string, unknown>,
  };

  if (missing.length > 0) {
    return NextResponse.json({ ok: false, ...base }, { status: 503 });
  }

  const [supabase, stripe, lulu] = await Promise.all([
    checkSupabase(),
    checkStripe(),
    checkLulu(),
  ]);

  const ok = supabase.ok && stripe.ok && lulu.ok;
  const checks = {
    env: base.checks.env,
    supabase,
    stripe,
    lulu,
  };

  return NextResponse.json(
    { ok, timestamp, warnings, checks },
    { status: ok ? 200 : 503 },
  );
}

