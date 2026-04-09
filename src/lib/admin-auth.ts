import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const ADMIN_ALLOWLIST_ENV = "ADMIN_EMAIL_ALLOWLIST";

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function getAdminEmailAllowlist(): string[] {
  const raw = process.env[ADMIN_ALLOWLIST_ENV] ?? "";
  return raw
    .split(",")
    .map((entry) => normalizeEmail(entry))
    .filter((entry) => entry.length > 0);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = normalizeEmail(email);
  const allowlist = getAdminEmailAllowlist();
  return allowlist.includes(normalized);
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

  const email = await getCurrentUserEmail();
  if (!isAdminEmail(email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { userId, email: normalizeEmail(email!) };
}
