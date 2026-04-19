import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

type EmailAddressLike = {
  emailAddress: string;
  verification?: { status: string | null } | null;
};

type UserLike = {
  emailAddresses?: EmailAddressLike[] | null;
  primaryEmailAddress?: EmailAddressLike | null;
};

/**
 * Clerk `Verification.status` values include: unverified, verified, transferable,
 * failed, expired (@clerk/backend Verification). For admin allowlist we accept
 * verified and transferable so OAuth / linking flows are not falsely rejected.
 */
function isClerkEmailAllowlistEligible(entry: EmailAddressLike): boolean {
  const status = entry.verification?.status;
  return status === "verified" || status === "transferable";
}

function emailEntriesForAdminCheck(user: UserLike | null | undefined): EmailAddressLike[] {
  if (!user) return [];
  const entries: EmailAddressLike[] = [...(user.emailAddresses ?? [])];
  const primary = user.primaryEmailAddress;
  if (primary?.emailAddress) {
    const primaryNorm = normalizeEmail(primary.emailAddress);
    const hasPrimary = entries.some(
      (e) => e?.emailAddress && normalizeEmail(e.emailAddress) === primaryNorm,
    );
    if (!hasPrimary) entries.push(primary);
  }
  return entries;
}

/**
 * Normalized emails on the user whose Clerk verification status is eligible
 * for allowlist matching (verified or transferable).
 */
export function collectNormalizedVerifiedEmails(
  user: UserLike | null | undefined,
): string[] {
  const out: string[] = [];
  for (const entry of emailEntriesForAdminCheck(user)) {
    if (!entry?.emailAddress) continue;
    if (!isClerkEmailAllowlistEligible(entry)) continue;
    out.push(normalizeEmail(entry.emailAddress));
  }
  return out;
}

function firstAllowlistedEmail(
  allowlist: string[],
  eligibleNormalized: string[],
): string | null {
  if (allowlist.length === 0 || eligibleNormalized.length === 0) return null;
  const allow = new Set(allowlist);
  for (const email of eligibleNormalized) {
    if (allow.has(email)) return email;
  }
  return null;
}

export function getAdminEmailAllowlist(): string[] {
  const raw = process.env.ADMIN_EMAIL_ALLOWLIST ?? "";
  return raw
    .split(",")
    .map((entry) => normalizeEmail(entry))
    .filter((entry) => entry.length > 0);
}

/** First allowlisted normalized email for this Clerk user, or null. */
export function getAdminAllowlistMatchForClerkUser(
  user: UserLike | null | undefined,
): string | null {
  const allowlist = getAdminEmailAllowlist();
  if (allowlist.length === 0) return null;
  return firstAllowlistedEmail(allowlist, collectNormalizedVerifiedEmails(user));
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = normalizeEmail(email);
  const allowlist = getAdminEmailAllowlist();
  return allowlist.includes(normalized);
}

/**
 * First eligible Clerk email on the signed-in user that appears in
 * `ADMIN_EMAIL_ALLOWLIST`, or null. Uses `currentUser()`; only calls Backend
 * `getUser` again when `currentUser()` is null but the session still has a userId.
 */
export async function getAdminAllowlistMatchEmail(): Promise<string | null> {
  const sessionUser = await currentUser();
  const fromSession = getAdminAllowlistMatchForClerkUser(sessionUser);
  if (fromSession) return fromSession;
  if (sessionUser !== null) return null;

  const { userId } = await auth();
  if (!userId) return null;

  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    return getAdminAllowlistMatchForClerkUser(user);
  } catch {
    return null;
  }
}

export async function getCurrentUserEmail(): Promise<string | null> {
  const sessionUser = await currentUser();
  const sessionEmail =
    sessionUser?.primaryEmailAddress?.emailAddress ??
    sessionUser?.emailAddresses?.[0]?.emailAddress ??
    null;
  if (sessionEmail) return sessionEmail;

  const { userId } = await auth();
  if (!userId) return null;

  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const primary = user.primaryEmailAddressId
      ? user.emailAddresses.find(
          (entry) => entry.id === user.primaryEmailAddressId,
        )
      : user.emailAddresses[0];
    return (
      primary?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null
    );
  } catch {
    return null;
  }
}

export async function requireAdminApi(): Promise<
  { userId: string; email: string } | NextResponse
> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = await getAdminAllowlistMatchEmail();
  if (!email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { userId, email };
}
