import Stripe from "stripe";

export function getStripe(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(secret, { typescript: true });
}

export const CREDIT_PACKAGES = {
  single: { amount: 25, quantity: 1, name: "1 Conversion Credit" },
  pack_50: { amount: 1000, quantity: 1, name: "50 Conversion Credits" },
  pack_100: { amount: 1500, quantity: 1, name: "100 Conversion Credits" },
} as const;

export type CreditPackageType = keyof typeof CREDIT_PACKAGES;
