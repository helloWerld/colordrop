import { notFound } from "next/navigation";
import type { CropRectInput } from "@/components/crop-rotate-editor";
import { getProductByTrimCode } from "@/lib/book-products";
import { getOrderStripePaymentDetails } from "@/lib/order-stripe-details";
import { createServerSupabaseClient } from "@/lib/supabase";
import { OrderDetailContent } from "@/app/dashboard/orders/[orderId]/order-detail-content";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const supabase = createServerSupabaseClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      user_id,
      book_id,
      amount_total,
      status,
      created_at,
      currency,
      shipping_name,
      shipping_address_line1,
      shipping_address_line2,
      shipping_city,
      shipping_state,
      shipping_postal_code,
      shipping_country,
      shipping_level,
      lulu_print_job_id,
      lulu_tracking_id,
      lulu_tracking_url,
      lulu_status,
      interior_pdf_path,
      cover_pdf_path,
      stripe_checkout_session_id,
      stripe_payment_intent_id,
      error_message
    `,
    )
    .eq("id", orderId)
    .single();

  if (error || !order) notFound();

  const { user_id: adminCustomerUserId, ...orderRow } = order;

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

  return (
    <OrderDetailContent
      order={orderRow}
      book={book}
      product={product}
      trimAspectRatio={trimAspectRatio}
      coverForGallery={coverForGallery}
      galleryPages={galleryPages}
      stripeDetails={stripeDetails}
      pdfHref={(kind) =>
        kind === "cover"
          ? `/api/admin/orders/${order.id}/pdf?kind=cover`
          : `/api/admin/orders/${order.id}/pdf`
      }
      backHref="/admin/orders"
      headerBackText="← Orders"
      footerBackText="Back to Orders"
      showSupportCallout={false}
      showLuluDashboardLink
      adminCustomerUserId={adminCustomerUserId}
    />
  );
}
