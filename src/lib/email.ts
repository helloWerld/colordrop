/**
 * Transactional email via Resend: order confirmation, shipping notification.
 * Env: RESEND_API_KEY, RESEND_FROM_EMAIL (e.g. orders@colordrop.ai)
 */

import { Resend } from "resend";
import { clerkClient } from "@clerk/nextjs/server";

export async function getEmailForUserId(userId: string): Promise<string | null> {
  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const primary = user.primaryEmailAddressId
      ? user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      : user.emailAddresses[0];
    return primary?.emailAddress ?? null;
  } catch {
    return null;
  }
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM_EMAIL ?? "ColorDrop <orders@colordrop.ai>";

function canSend(): boolean {
  return !!resend && !!process.env.RESEND_API_KEY;
}

export async function sendOrderConfirmation(params: {
  to: string;
  orderId: string;
  orderShortId: string;
  amountTotalCents: number;
  bookTitle: string;
  pageCount: number;
}): Promise<{ ok: boolean; error?: string }> {
  if (!canSend()) return { ok: false, error: "Resend not configured" };
  const { to, orderShortId, amountTotalCents, bookTitle, pageCount } = params;
  const { error } = await resend!.emails.send({
    from: FROM,
    to: [to],
    subject: `Your ColorDrop order #${orderShortId} is confirmed`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h1 style="color: #FF6B6B;">Your book is on its way!</h1>
        <p>Order <strong>#${orderShortId}</strong> is confirmed.</p>
        <p><strong>${bookTitle}</strong> · ${pageCount} pages</p>
        <p>Amount paid: <strong>$${Math.round(amountTotalCents / 100)}</strong></p>
        <p>We'll email you tracking info when your book ships.</p>
        <p style="color: #666; font-size: 14px;">Coloring books are printed on demand and customized just for you. All sales are final.</p>
      </div>
    `,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function sendShippingNotification(params: {
  to: string;
  orderId: string;
  orderShortId: string;
  trackingUrl?: string;
  trackingId?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!canSend()) return { ok: false, error: "Resend not configured" };
  const { to, orderShortId, trackingUrl, trackingId } = params;
  const trackHtml = trackingUrl
    ? `<p><a href="${trackingUrl}" style="color: #4ECDC4;">Track your shipment</a></p>`
    : trackingId
      ? `<p>Tracking number: <strong>${trackingId}</strong></p>`
      : "";
  const { error } = await resend!.emails.send({
    from: FROM,
    to: [to],
    subject: `Your ColorDrop order #${orderShortId} has shipped`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h1 style="color: #FF6B6B;">Your coloring book has shipped!</h1>
        <p>Order <strong>#${orderShortId}</strong> is on its way.</p>
        ${trackHtml}
      </div>
    `,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
