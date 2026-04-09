import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getAdminUserCockpitData } from "@/lib/admin-user-cockpit";
import { MAX_ADMIN_FREE_CREDITS_PER_REQUEST } from "@/lib/admin-free-credits";
import { logIntegrationEvent } from "@/lib/integration-events";

const MAX_REASON_LENGTH = 500;

export async function GET(
  _request: Request,
  { params }: { params: { userId: string } },
) {
  const admin = await requireAdminApi();
  if (admin instanceof NextResponse) return admin;

  const supabase = createServerSupabaseClient();
  try {
    const payload = await getAdminUserCockpitData(supabase, params.userId);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === "USER_NOT_FOUND") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { userId: string } },
) {
  const admin = await requireAdminApi();
  if (admin instanceof NextResponse) return admin;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const creditsRaw = record.creditsToAdd;
  const reasonRaw = record.reason;

  if (typeof creditsRaw !== "number" || !Number.isInteger(creditsRaw)) {
    return NextResponse.json(
      { error: "creditsToAdd must be a positive integer" },
      { status: 400 },
    );
  }
  if (
    creditsRaw < 1 ||
    creditsRaw > MAX_ADMIN_FREE_CREDITS_PER_REQUEST
  ) {
    return NextResponse.json(
      {
        error: `creditsToAdd must be between 1 and ${MAX_ADMIN_FREE_CREDITS_PER_REQUEST}`,
      },
      { status: 400 },
    );
  }

  let reason: string | undefined;
  if (reasonRaw !== undefined && reasonRaw !== null) {
    if (typeof reasonRaw !== "string") {
      return NextResponse.json(
        { error: "reason must be a string" },
        { status: 400 },
      );
    }
    const trimmed = reasonRaw.trim().slice(0, MAX_REASON_LENGTH);
    reason = trimmed.length > 0 ? trimmed : undefined;
  }

  const supabase = createServerSupabaseClient();
  const { data: profile, error: selectError } = await supabase
    .from("user_profiles")
    .select("user_id, free_conversions_remaining, paid_credits")
    .eq("user_id", params.userId)
    .maybeSingle();

  if (selectError) {
    return NextResponse.json({ error: selectError.message }, { status: 500 });
  }
  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const current = profile.free_conversions_remaining ?? 0;
  const next = current + creditsRaw;

  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({
      free_conversions_remaining: next,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", params.userId);

  if (updateError) {
    console.error("admin add free credits", updateError);
    return NextResponse.json(
      { error: "Failed to update credits" },
      { status: 500 },
    );
  }

  console.info(
    JSON.stringify({
      event: "admin_free_credits_grant",
      targetUserId: params.userId,
      adminUserId: admin.userId,
      adminEmail: admin.email,
      creditsAdded: creditsRaw,
      freeRemainingAfter: next,
      reason: reason ?? null,
    }),
  );
  try {
    await logIntegrationEvent(
      {
        provider: "system",
        eventType: "admin.free_credits_granted",
        severity: "info",
        status: "success",
        payload: {
          targetUserId: params.userId,
          adminUserId: admin.userId,
          adminEmail: admin.email,
          creditsAdded: creditsRaw,
          freeRemainingAfter: next,
          reason: reason ?? null,
        },
      },
      supabase,
    );
  } catch (error) {
    console.error("admin free-credit audit log failure", error);
  }

  return NextResponse.json({
    free_conversions_remaining: next,
    paid_credits: profile.paid_credits ?? 0,
  });
}
