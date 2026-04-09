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
const CUSTOMER_SUPPORT_EMAIL = "hello@colordrop.ai";
const SUPPORT_FOOTER_HTML = `<p style="margin-top:24px; color:#666; font-size:14px;">Questions? Email <a href="mailto:${CUSTOMER_SUPPORT_EMAIL}" style="color:#4ECDC4;">${CUSTOMER_SUPPORT_EMAIL}</a>. We aim to respond within 72 hours.</p>`;

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
        ${SUPPORT_FOOTER_HTML}
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
        ${SUPPORT_FOOTER_HTML}
      </div>
    `,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** When print fulfillment fails after payment: refund succeeded or ops must reconcile manually. */
export async function sendFulfillmentFailureCustomerEmail(params: {
  to: string;
  orderShortId: string;
  bookTitle: string;
  paymentRefunded: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  if (!canSend()) return { ok: false, error: "Resend not configured" };
  const { to, orderShortId, bookTitle, paymentRefunded } = params;
  const support =
    process.env.OPS_ALERT_EMAIL ?? "hello@colordrop.ai";
  const bodyHtml = paymentRefunded
    ? `
      <p>We were not able to send your book to print. Your order <strong>#${orderShortId}</strong> for <strong>${bookTitle}</strong> could not be fulfilled.</p>
      <p>We have issued a <strong>full refund</strong> to your original payment method. Depending on your bank, it may take several business days to appear.</p>
      <p>This message applies to technical non-fulfillment before printing. Manufacturing defects on delivered books are handled through replacement support.</p>
      <p>You can place a new order from your dashboard when you are ready.</p>
    `
    : `
      <p>We were not able to send your book to print. Your order <strong>#${orderShortId}</strong> for <strong>${bookTitle}</strong> could not be fulfilled.</p>
      <p>We could not complete an automatic refund from our systems. Our team has been notified and will follow up. If you need help sooner, contact us at <a href="mailto:${support}">${support}</a>.</p>
      <p>This message applies to technical non-fulfillment before printing. Manufacturing defects on delivered books are handled through replacement support.</p>
    `;
  const { error } = await resend!.emails.send({
    from: FROM,
    to: [to],
    subject: paymentRefunded
      ? `Update on your ColorDrop order #${orderShortId} — refunded`
      : `Update on your ColorDrop order #${orderShortId}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h1 style="color: #FF6B6B;">We couldn&apos;t fulfill your order</h1>
        ${bodyHtml}
      </div>
    `,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Internal / ops alerts (e.g. Stripe webhook reconciliation). Defaults to hello@colordrop.ai; override with OPS_ALERT_EMAIL. */
export async function sendOpsAlert(params: {
  subject: string;
  textBody: string;
}): Promise<{ ok: boolean; error?: string }> {
  const to = process.env.OPS_ALERT_EMAIL ?? "hello@colordrop.ai";
  if (!canSend()) {
    console.error("[ops-alert] Resend not configured; subject:", params.subject);
    console.error("[ops-alert] body:\n", params.textBody);
    return { ok: false, error: "Resend not configured" };
  }
  const { error } = await resend!.emails.send({
    from: FROM,
    to: [to],
    subject: params.subject,
    text: params.textBody,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
