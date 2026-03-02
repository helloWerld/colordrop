import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getPrintJobStatus } from "@/lib/lulu";
import { getEmailForUserId, sendShippingNotification } from "@/lib/email";

type LuluWebhookBody = {
  print_job_id?: number;
  id?: number;
  external_id?: string;
  status?: string | { name?: string };
  name?: string;
  message?: string;
  tracking_info?: { tracking_id?: string; tracking_url?: string; tracking_number?: string }[] | { tracking_id?: string; tracking_url?: string };
};

/**
 * Lulu webhook: PRINT_JOB_STATUS_CHANGED.
 * Optionally verify HMAC with LULU_WEBHOOK_SECRET; if not set, accept and process.
 * Updates order with lulu_status, tracking info; when SHIPPED, set order status to shipped.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  let body: LuluWebhookBody;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const secret = process.env.LULU_WEBHOOK_SECRET;
  if (secret) {
    const headersList = await headers();
    const sig = headersList.get("x-lulu-signature") ?? headersList.get("x-hub-signature-256");
    if (!sig || !verifyLuluHmac(raw, secret, sig)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  }

  const printJobId = body.print_job_id ?? body.id;
  if (!printJobId) {
    return NextResponse.json({ error: "Missing print_job_id" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, lulu_status")
    .eq("lulu_print_job_id", printJobId)
    .limit(1);
  const order = orders?.[0];
  if (!order) {
    const status = await getPrintJobStatus(Number(printJobId));
    if (status && body.external_id) {
      const { data: byExternal } = await supabase
        .from("orders")
        .select("id")
        .eq("id", body.external_id)
        .single();
      if (byExternal?.id) {
        await updateOrderFromLuluStatus(supabase, byExternal.id, status);
      }
    }
    return NextResponse.json({ received: true });
  }

  const statusObj = body.status;
  const statusName =
    typeof statusObj === "object" && statusObj?.name
      ? statusObj.name
      : typeof statusObj === "string"
        ? statusObj
        : body.name ?? order.lulu_status ?? "";
  const trackingInfo = body.tracking_info;
  const tracking = Array.isArray(trackingInfo) ? trackingInfo[0] : trackingInfo;
  const trackingId =
    typeof tracking === "object"
      ? (tracking?.tracking_id ?? (tracking as { tracking_number?: string } | undefined)?.tracking_number)
      : undefined;
  const trackingUrl = typeof tracking === "object" ? tracking?.tracking_url : undefined;

  const becameShipped = statusName === "SHIPPED" || statusName === "IN_TRANSIT";
  await updateOrderFromLuluStatus(supabase, order.id, {
    name: statusName,
    tracking_id: trackingId,
    tracking_url: trackingUrl,
  });

  if (becameShipped) {
    const { data: orderRow } = await supabase
      .from("orders")
      .select("user_id, lulu_tracking_url, lulu_tracking_id")
      .eq("id", order.id)
      .single();
    if (orderRow?.user_id) {
      const email = await getEmailForUserId(orderRow.user_id);
      if (email) {
        sendShippingNotification({
          to: email,
          orderId: order.id,
          orderShortId: order.id.slice(0, 8),
          trackingUrl: orderRow.lulu_tracking_url ?? undefined,
          trackingId: orderRow.lulu_tracking_id ?? undefined,
        }).catch((e) => console.error("Shipping email failed", e));
      }
    }
  }

  return NextResponse.json({ received: true });
}

async function updateOrderFromLuluStatus(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  orderId: string,
  status: { name: string; tracking_id?: string; tracking_url?: string }
): Promise<void> {
  const updates: Record<string, unknown> = {
    lulu_status: status.name,
    updated_at: new Date().toISOString(),
  };
  if (status.tracking_id) updates.lulu_tracking_id = status.tracking_id;
  if (status.tracking_url) updates.lulu_tracking_url = status.tracking_url;
  if (status.name === "SHIPPED" || status.name === "IN_TRANSIT") {
    updates.status = "shipped";
  }
  if (status.name === "DELIVERED") {
    updates.status = "delivered";
  }
  await supabase.from("orders").update(updates).eq("id", orderId);
}

function verifyLuluHmac(payload: string, secret: string, signature: string): boolean {
  try {
    const expected = "sha256=" + createHmac("sha256", secret).update(payload).digest("hex");
    if (signature.length !== expected.length) return false;
    return timingSafeEqual(Buffer.from(signature, "utf8"), Buffer.from(expected, "utf8"));
  } catch {
    return false;
  }
}
