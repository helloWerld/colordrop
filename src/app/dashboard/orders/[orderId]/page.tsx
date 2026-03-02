import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase";

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
    .select(`
      id,
      book_id,
      amount_total,
      status,
      created_at,
      credits_applied_value_cents,
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
      lulu_status
    `)
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

  const { data: book } = await supabase
    .from("books")
    .select("id, title, page_count")
    .eq("id", order.book_id)
    .single();

  const { data: pages } = await supabase
    .from("pages")
    .select("id, outline_image_path, position")
    .eq("book_id", order.book_id)
    .order("position", { ascending: true });

  const pageThumbUrls: string[] = [];
  if (pages?.length) {
    for (const p of pages) {
      const { data: signed } = await supabase.storage
        .from("outlines")
        .createSignedUrl(p.outline_image_path, 3600);
      if (signed?.signedUrl) pageThumbUrls.push(signed.signedUrl);
    }
  }

  const steps = [
    { id: "paid", label: "Paid" },
    { id: "processing", label: "Processing" },
    { id: "printing", label: "Printing" },
    { id: "shipped", label: "Shipped" },
    { id: "delivered", label: "Delivered" },
  ];
  const statusToStep: Record<string, number> = {
    paid: 0,
    processing: 1,
    submitted_to_print: 2,
    in_production: 2,
    shipped: 3,
    delivered: 4,
    error: -1,
  };
  const currentStep = statusToStep[order.status] ?? 0;

  const addressLines = [
    order.shipping_name,
    order.shipping_address_line1,
    order.shipping_address_line2,
    [order.shipping_city, order.shipping_state, order.shipping_postal_code].filter(Boolean).join(", "),
    order.shipping_country,
  ].filter(Boolean);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard" className="text-sm text-primary hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold text-foreground">
          Order #{order.id.slice(0, 8)}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Placed {new Date(order.created_at).toLocaleDateString()}
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-heading text-sm font-semibold text-foreground">
          Status
        </h2>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {steps.map((step, i) => (
            <span
              key={step.id}
              className={
                i <= currentStep
                  ? "rounded-full bg-primary/20 px-3 py-1 text-sm font-medium text-foreground"
                  : "rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground"
              }
            >
              {step.label}
            </span>
          ))}
        </div>
        <p className="mt-2 text-sm capitalize text-muted-foreground">
          Current: {order.status.replace(/_/g, " ")}
          {order.lulu_status ? ` (Lulu: ${order.lulu_status})` : ""}
        </p>
        {order.lulu_tracking_url && (
          <p className="mt-2">
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
          <p className="mt-2 text-sm text-muted-foreground">
            Tracking: {order.lulu_tracking_id}
          </p>
        )}
      </section>

      {book && (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-heading text-sm font-semibold text-foreground">
            Book
          </h2>
          <p className="mt-2 font-medium text-foreground">{book.title}</p>
          <p className="text-sm text-muted-foreground">{book.page_count} pages</p>
          {pageThumbUrls.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {pageThumbUrls.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-lg border border-border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Page ${i + 1}`}
                    className="h-20 w-full object-cover"
                  />
                </a>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-heading text-sm font-semibold text-foreground">
          Payment
        </h2>
        <p className="mt-2 text-xl font-bold text-foreground">
          ${((order.amount_total ?? 0) / 100).toFixed(2)}
        </p>
        {order.credits_applied_value_cents > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            {order.credits_applied_value_cents / 100}¢ in credits applied
          </p>
        )}
      </section>

      {addressLines.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-heading text-sm font-semibold text-foreground">
            Shipping address
          </h2>
          <address className="mt-2 whitespace-pre-line text-sm not-italic text-muted-foreground">
            {addressLines.join("\n")}
          </address>
          {order.shipping_level && (
            <p className="mt-2 text-sm text-muted-foreground">
              Method: {order.shipping_level.replace(/_/g, " ")}
            </p>
          )}
        </section>
      )}

      <div>
        <Link
          href="/dashboard"
          className="rounded-full border border-border px-6 py-3 font-medium hover:bg-muted/50"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
