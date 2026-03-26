import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import type { CropRectInput } from "@/components/crop-rotate-editor";
import { getProductByTrimCode } from "@/lib/book-products";
import { getOrderStripePaymentDetails } from "@/lib/order-stripe-details";
import { SHIPPING_LEVELS } from "@/lib/pricing";
import { createServerSupabaseClient } from "@/lib/supabase";
import { OrderBookGallery } from "./order-book-gallery";
import { OrderStatusSteps } from "./order-status-steps";
import { OrderSupportCallout } from "./order-support-callout";

function shippingOptionLabel(level: string | null | undefined): string | null {
  if (!level) return null;
  const row = SHIPPING_LEVELS.find((s) => s.id === level);
  if (row) return `${row.label} · ${row.days} business days`;
  return level.replace(/_/g, " ");
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) return null;

  const { orderId } = await params;
  const supabase = createServerSupabaseClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      book_id,
      amount_total,
      status,
      created_at,
      credits_applied_value_cents,
      currency,
      shipping_name,
      shipping_address_line1,
      shipping_address_line2,
      shipping_city,
      shipping_state,
      shipping_postal_code,
      shipping_country,
      shipping_level,
      lulu_tracking_id,
      lulu_tracking_url,
      lulu_status,
      interior_pdf_path,
      cover_pdf_path,
      stripe_checkout_session_id,
      error_message
    `,
    )
    .eq("id", orderId)
    .eq("user_id", userId)
    .single();

  if (error || !order) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">Order not found.</p>
        <Link href="/dashboard" className="text-primary hover:underline">
          ← Dashboard
        </Link>
      </div>
    );
  }

  const stripeDetails = await getOrderStripePaymentDetails(
    order.stripe_checkout_session_id,
  );

  const { data: book } = await supabase
    .from("books")
    .select("id, title, page_count, trim_size")
    .eq("id", order.book_id)
    .single();

  const { data: pages } = await supabase
    .from("pages")
    .select("id, outline_image_path, position, crop_rect, rotation_degrees")
    .eq("book_id", order.book_id)
    .order("position", { ascending: true });

  const { data: cover } = await supabase
    .from("covers")
    .select("image_path, crop_rect, rotation_degrees")
    .eq("book_id", order.book_id)
    .maybeSingle();

  const product = book?.trim_size ? getProductByTrimCode(book.trim_size) : null;
  const trimAspectRatio = product
    ? product.widthInches / product.heightInches
    : 9 / 16;

  const coverUrl = cover
    ? ((
        await supabase.storage
          .from("covers")
          .createSignedUrl(cover.image_path, 3600)
      ).data?.signedUrl ?? null)
    : null;

  const galleryPages: {
    url: string;
    crop_rect: CropRectInput;
    rotation_degrees: number | null;
    label: string;
  }[] = [];

  if (pages?.length) {
    let idx = 0;
    for (const p of pages) {
      const { data: signed } = await supabase.storage
        .from("outlines")
        .createSignedUrl(p.outline_image_path, 3600);
      if (signed?.signedUrl) {
        idx += 1;
        galleryPages.push({
          url: signed.signedUrl,
          crop_rect: (p.crop_rect as CropRectInput) ?? null,
          rotation_degrees: p.rotation_degrees ?? null,
          label: `Page ${idx}`,
        });
      }
    }
  }

  const coverForGallery =
    coverUrl && cover
      ? {
          url: coverUrl,
          crop_rect: (cover.crop_rect as CropRectInput) ?? null,
          rotation_degrees: cover.rotation_degrees ?? null,
        }
      : null;

  const steps = [
    { id: "paid", label: "Paid" },
    { id: "processing", label: "Processing" },
    { id: "printing", label: "Printing" },
    { id: "shipped", label: "Shipped" },
    { id: "delivered", label: "Delivered" },
  ];
  const statusToStep: Record<string, number> = {
    pending: -2,
    paid: 0,
    processing: 1,
    submitted_to_print: 2,
    in_production: 2,
    shipped: 3,
    delivered: 4,
    error: -1,
  };
  const currentStep = statusToStep[order.status] ?? 0;
  const hasError = order.status === "error";
  const isPending = order.status === "pending";

  const addressLines = [
    order.shipping_name,
    order.shipping_address_line1,
    order.shipping_address_line2,
    [order.shipping_city, order.shipping_state, order.shipping_postal_code]
      .filter(Boolean)
      .join(", "),
    order.shipping_country,
  ].filter(Boolean);

  const currency = (order.currency ?? "usd").toUpperCase();
  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency === "USD" ? "USD" : currency,
  });

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-primary hover:underline"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold text-foreground">
          Order #{order.id.slice(0, 8)}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Placed {new Date(order.created_at).toLocaleDateString()}
        </p>
      </div>

      <div className="flex flex-row gap-4">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm flex-1">
          <h2 className="font-heading text-sm font-semibold text-foreground">
            Status
          </h2>
          <OrderStatusSteps
            steps={steps}
            currentStepIndex={currentStep}
            hasError={hasError}
            errorMessage={order.error_message}
            isPending={isPending}
          />
          {order.lulu_tracking_url && (
            <p className="mt-4">
              <a
                href={order.lulu_tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Track shipment
              </a>
            </p>
          )}
          {order.lulu_tracking_id && !order.lulu_tracking_url && (
            <p className="mt-4 text-sm text-muted-foreground">
              Tracking: {order.lulu_tracking_id}
            </p>
          )}
        </section>
        {addressLines.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm flex-1">
            <h2 className="font-heading text-sm font-semibold text-foreground">
              Shipping address
            </h2>
            <address className="mt-6 whitespace-pre-line text-sm not-italic text-muted-foreground">
              {addressLines.join("\n")}
            </address>
            {order.shipping_level && (
              <p className="mt-2 text-sm text-muted-foreground">
                Method: {shippingOptionLabel(order.shipping_level)}
              </p>
            )}
          </section>
        )}
      </div>

      {book &&
        (() => {
          const sizeLabel = product
            ? `${product.label} ${product.widthInches}" × ${product.heightInches}"`
            : null;
          return (
            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="font-heading text-sm font-semibold text-foreground">
                Book
              </h2>
              <p className="mt-2 font-medium text-foreground">{book.title}</p>
              <p className="text-sm text-muted-foreground">
                {sizeLabel ? `${sizeLabel} · ` : ""}
                {book.page_count} pages
              </p>
              {(order.interior_pdf_path || order.cover_pdf_path) && (
                <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {order.cover_pdf_path ? (
                    <a
                      href={`/api/orders/${order.id}/pdf?kind=cover`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:border-primary border border-border rounded-lg px-3 py-2"
                    >
                      View cover PDF
                    </a>
                  ) : null}
                  {order.interior_pdf_path ? (
                    <a
                      href={`/api/orders/${order.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:border-primary border border-border rounded-lg px-3 py-2"
                    >
                      View interior PDF
                    </a>
                  ) : null}
                </p>
              )}
              <OrderBookGallery
                trimAspectRatio={trimAspectRatio}
                cover={coverForGallery}
                pages={galleryPages}
              />
            </section>
          );
        })()}

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-heading text-sm font-semibold text-foreground">
          Payment
        </h2>
        <dl className="mt-3 space-y-2 text-sm">
          {stripeDetails?.bookCents != null && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Book (print and bind)</dt>
              <dd className="font-medium text-foreground tabular-nums">
                {money.format(stripeDetails.bookCents / 100)}
              </dd>
            </div>
          )}
          {stripeDetails?.shippingCents != null && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="font-medium text-foreground tabular-nums">
                {money.format(stripeDetails.shippingCents / 100)}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-4 border-t border-border pt-2">
            <dt className="font-medium text-foreground">Total paid</dt>
            <dd className="text-lg font-bold text-foreground tabular-nums">
              {money.format((order.amount_total ?? 0) / 100)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Paid at</dt>
            <dd className="text-foreground">
              {new Date(order.created_at).toLocaleString()}
            </dd>
          </div>
          {stripeDetails?.paymentMethodSummary ? (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Payment method</dt>
              <dd className="text-foreground">
                {stripeDetails.paymentMethodSummary}
              </dd>
            </div>
          ) : null}
          {order.shipping_level ? (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Shipping option</dt>
              <dd className="text-right text-foreground">
                {shippingOptionLabel(order.shipping_level)}
              </dd>
            </div>
          ) : null}
          {(order.credits_applied_value_cents ?? 0) > 0 ? (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Credits applied</dt>
              <dd className="tabular-nums text-foreground">
                {money.format((order.credits_applied_value_cents ?? 0) / 100)}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      <OrderSupportCallout />

      <div>
        <Link
          href="/dashboard"
          className="rounded-lg border border-border px-6 py-3 font-medium hover:bg-muted/50"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
