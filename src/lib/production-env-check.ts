export interface ProductionReadiness {
  ready: boolean;
  warnings: string[];
}

/**
 * Validate that critical environment variables are set and look correct
 * for a production deployment. Sandbox/test flags suppress the
 * corresponding live-key checks so the function stays useful in dev.
 */
export function checkProductionEnv(): ProductionReadiness {
  const warnings: string[] = [];
  const isProd = process.env.NODE_ENV === "production";
  const stripeSandbox = process.env.STRIPE_USE_SANDBOX === "true";
  const luluSandbox = process.env.LULU_USE_SANDBOX === "true";

  if (isProd && !stripeSandbox) {
    const sk = process.env.STRIPE_SECRET_KEY ?? "";
    if (!sk) {
      warnings.push("STRIPE_SECRET_KEY is not set.");
    } else if (!sk.startsWith("sk_live_")) {
      warnings.push(
        "STRIPE_SECRET_KEY does not start with sk_live_ (looks like a test key in production).",
      );
    }

    const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
    if (!pk) {
      warnings.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set.");
    } else if (!pk.startsWith("pk_live_")) {
      warnings.push(
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY does not start with pk_live_ (looks like a test key in production).",
      );
    }
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET && !stripeSandbox) {
    warnings.push("STRIPE_WEBHOOK_SECRET is not set.");
  }

  if (isProd && !luluSandbox) {
    if (!process.env.LULU_CLIENT_KEY) {
      warnings.push("LULU_CLIENT_KEY is not set.");
    }
    if (!process.env.LULU_CLIENT_SECRET) {
      warnings.push("LULU_CLIENT_SECRET is not set.");
    }
    const base = process.env.LULU_API_BASE_URL ?? "";
    if (base && base.includes("sandbox")) {
      warnings.push(
        "LULU_API_BASE_URL points to sandbox but LULU_USE_SANDBOX is not true.",
      );
    }
  }

  if (isProd && !process.env.LULU_WEBHOOK_SECRET) {
    warnings.push("LULU_WEBHOOK_SECRET is not set (required for webhook signature verification in production).");
  }

  if (!process.env.RESEND_API_KEY) {
    warnings.push("RESEND_API_KEY is not set.");
  }

  if (isProd && !process.env.CRON_SECRET) {
    warnings.push("CRON_SECRET is not set (required to authenticate cron requests in production).");
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    warnings.push("NEXT_PUBLIC_APP_URL is not set.");
  }

  return { ready: warnings.length === 0, warnings };
}
