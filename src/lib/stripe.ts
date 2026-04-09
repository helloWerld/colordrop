import Stripe from "stripe";

/** Same convention as LULU_USE_SANDBOX: only the string "true" enables sandbox. */
export function stripeUseSandbox(): boolean {
  return process.env.STRIPE_USE_SANDBOX === "true";
}

function getActiveStripeSecretKey(): string {
  if (stripeUseSandbox()) {
    const s = process.env.STRIPE_SANDBOX_SECRET_KEY;
    if (!s) {
      throw new Error(
        "STRIPE_SANDBOX_SECRET_KEY is not set (STRIPE_USE_SANDBOX=true)"
      );
    }
    return s;
  }
  const s = process.env.STRIPE_SECRET_KEY;
  if (!s) throw new Error("STRIPE_SECRET_KEY is not set");
  return s;
}

export function getStripe(): Stripe {
  return new Stripe(getActiveStripeSecretKey(), { typescript: true });
}

/**
 * Webhook signing secret for the active Stripe mode (must match getStripe()).
 */
export function getStripeWebhookSecret(): string {
  if (stripeUseSandbox()) {
    const s = process.env.STRIPE_SANDBOX_WEBHOOK_SECRET;
    if (!s) {
      throw new Error(
        "STRIPE_SANDBOX_WEBHOOK_SECRET is not set (STRIPE_USE_SANDBOX=true)"
      );
    }
    return s;
  }
  const s = process.env.STRIPE_WEBHOOK_SECRET;
  if (!s) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  return s;
}

/**
 * True when Stripe test/sandbox UI should be shown (banners, config API).
 * Flag-first; if STRIPE_USE_SANDBOX is unset, infer from key prefixes (legacy).
 */
export function isStripeTestMode(): boolean {
  if (process.env.STRIPE_USE_SANDBOX === "true") return true;
  if (process.env.STRIPE_USE_SANDBOX === "false") return false;

  const secret = process.env.STRIPE_SECRET_KEY;
  if (secret?.startsWith("sk_test_")) return true;
  if (secret?.startsWith("sk_live_")) return false;
  const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (pk?.startsWith("pk_test_")) return true;
  if (pk?.startsWith("pk_live_")) return false;
  const pkSandbox = process.env.NEXT_PUBLIC_STRIPE_SANDBOX_PUBLISHABLE_KEY;
  if (pkSandbox?.startsWith("pk_test_")) return true;
  if (pkSandbox?.startsWith("pk_live_")) return false;
  return false;
}

/**
 * Deep link into Stripe Dashboard for a book order’s Checkout Session / payment.
 * Prefer payment intent when present — Dashboard “Payments” URLs are most reliable for `pi_`.
 * Falls back to Checkout Session id (`cs_`) in the same path (supported in current Dashboard).
 */
export function stripeDashboardPaymentDeepLink(params: {
  checkoutSessionId?: string | null;
  paymentIntentId?: string | null;
}): string | null {
  const pi = params.paymentIntentId?.trim();
  const cs = params.checkoutSessionId?.trim();
  if (!pi && !cs) return null;

  const origin = isStripeTestMode()
    ? "https://dashboard.stripe.com/test"
    : "https://dashboard.stripe.com";

  if (pi) return `${origin}/payments/${encodeURIComponent(pi)}`;
  return `${origin}/payments/${encodeURIComponent(cs!)}`;
}

export const CREDIT_PACKAGES = {
  /** Unit amount in cents; quantity 1–49 passed at checkout */
  single: { amount: 99, name: "Conversion Credits" },
  pack_50: { amount: 2499, quantity: 1, name: "50 Conversion Credits" },
  pack_100: { amount: 3999, quantity: 1, name: "100 Conversion Credits" },
} as const;

export type CreditPackageType = keyof typeof CREDIT_PACKAGES;
