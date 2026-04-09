import Link from "next/link";
import type { OrderGalleryCover, OrderGalleryPage } from "./order-book-gallery";
import { OrderBookGallery } from "./order-book-gallery";
import { OrderStatusSteps } from "./order-status-steps";
import { OrderSupportCallout } from "./order-support-callout";
import type { OrderStripePaymentDetails } from "@/lib/order-stripe-details";
import type { BookProduct } from "@/lib/book-products";
import { luluDashboardPrintJobLink } from "@/lib/lulu";
import { SHIPPING_LEVELS } from "@/lib/pricing";
import { stripeDashboardPaymentDeepLink } from "@/lib/stripe";

export type OrderDetailOrderRow = {
  id: string;
  book_id: string;
  amount_total: number | null;
  status: string;
  created_at: string;
  currency: string | null;
  shipping_name: string | null;
  shipping_address_line1: string | null;
  shipping_address_line2: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_postal_code: string | null;
  shipping_country: string | null;
  shipping_level: string | null;
  lulu_tracking_id: string | null;
  lulu_tracking_url: string | null;
  lulu_status: string | null;
  lulu_print_job_id?: number | null;
  interior_pdf_path: string | null;
  cover_pdf_path: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  error_message: string | null;
};

export type OrderDetailBookRow = {
  id: string;
  title: string | null;
  page_count: number | null;
  trim_size: string | null;
};

function shippingOptionLabel(level: string | null | undefined): string | null {
  if (!level) return null;
  const row = SHIPPING_LEVELS.find((s) => s.id === level);
  if (row) return `${row.label} · ${row.days} business days`;
  return level.replace(/_/g, " ");
}

export function OrderDetailContent({
  order,
  book,
  product,
  trimAspectRatio,
  coverForGallery,
  galleryPages,
  stripeDetails,
  pdfHref,
  backHref,
  headerBackText,
  footerBackText,
  showSupportCallout,
  showLuluDashboardLink = false,
  adminCustomerUserId,
}: {
  order: OrderDetailOrderRow;
  book: OrderDetailBookRow | null;
  product: BookProduct | null;
  trimAspectRatio: number;
  coverForGallery: OrderGalleryCover | null;
  galleryPages: OrderGalleryPage[];
  stripeDetails: OrderStripePaymentDetails | null;
  pdfHref: (kind: "interior" | "cover") => string;
  backHref: string;
  headerBackText: string;
  footerBackText: string;
  showSupportCallout: boolean;
  showLuluDashboardLink?: boolean;
  adminCustomerUserId?: string | null;
}) {
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
    refunded: -1,
  };
  const currentStep = statusToStep[order.status] ?? 0;
  const hasError = order.status === "error";
  const isRefunded = order.status === "refunded";
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

  const stripeDashboardUrl = stripeDashboardPaymentDeepLink({
    checkoutSessionId: order.stripe_checkout_session_id,
    paymentIntentId: order.stripe_payment_intent_id,
  });
  const luluDashboardUrl =
    showLuluDashboardLink && typeof order.lulu_print_job_id === "number"
      ? luluDashboardPrintJobLink(order.lulu_print_job_id)
      : null;

  return (
    <div className="space-y-8">
      <div>
        <Link href={backHref} className="text-sm text-primary hover:underline">
          {headerBackText}
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold text-foreground">
          Order #{order.id.slice(0, 8)}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Placed {new Date(order.created_at).toLocaleDateString()}
        </p>
        {adminCustomerUserId ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Customer:{" "}
            <Link
              href={`/admin/users/${adminCustomerUserId}`}
              className="font-medium text-primary hover:underline"
            >
              View user in admin
            </Link>
            {" · "}
            Cover and interior PDF links open the files uploaded for the Lulu
            print job.
          </p>
        ) : null}
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
            isRefunded={isRefunded}
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
          {showLuluDashboardLink &&
          typeof order.lulu_print_job_id === "number" ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Lulu job:{" "}
              {luluDashboardUrl ? (
                <a
                  href={luluDashboardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  {order.lulu_print_job_id}
                </a>
              ) : (
                <span className="font-medium text-foreground">
                  {order.lulu_print_job_id}
                </span>
              )}
            </p>
          ) : null}
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
                      href={pdfHref("cover")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:border-primary border border-border rounded-lg px-3 py-2"
                    >
                      View cover PDF
                    </a>
                  ) : null}
                  {order.interior_pdf_path ? (
                    <a
                      href={pdfHref("interior")}
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
        </dl>
      </section>

      {showSupportCallout ? <OrderSupportCallout /> : null}

      <div>
        <Link
          href={backHref}
          className="rounded-lg border border-border px-6 py-3 font-medium hover:bg-muted/50"
        >
          {footerBackText}
        </Link>
      </div>
    </div>
  );
}
