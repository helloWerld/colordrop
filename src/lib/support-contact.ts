/** Canonical customer support email (PRD / Terms). Override only for staging via env. */
export const PUBLIC_SUPPORT_EMAIL = "hello@colordrop.ai";

export function getPublicSupportEmail(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : PUBLIC_SUPPORT_EMAIL;
}
