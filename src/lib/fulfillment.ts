/**
 * Post-payment fulfillment: generate PDFs, upload to storage, create Lulu print job.
 * Called from Stripe webhook after order is created.
 */

import { createServerSupabaseClient } from "@/lib/supabase";
import { generateInteriorPdf, generateCoverPdf } from "@/lib/pdf";
import { getCoverDimensions, createPrintJob } from "@/lib/lulu";
import {
  getPodPackageId,
  getTrimSizeIdFromCode,
} from "@/lib/book-products";

const CONTACT_EMAIL =
  process.env.LULU_CONTACT_EMAIL ??
  process.env.RESEND_FROM_EMAIL ??
  "orders@colordrop.ai";

export type FulfillmentResult =
  | { ok: true; luluPrintJobId: number }
  | { ok: false; error: string };

export async function runFulfillment(
  orderId: string,
): Promise<FulfillmentResult> {
  const supabase = createServerSupabaseClient();

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select(
      "id, book_id, status, interior_pdf_path, cover_pdf_path, lulu_print_job_id, shipping_name, shipping_address_line1, shipping_address_line2, shipping_city, shipping_state, shipping_postal_code, shipping_country, shipping_phone, shipping_level",
    )
    .eq("id", orderId)
    .single();

  if (orderErr || !order) {
    return { ok: false, error: "Order not found" };
  }
  if (order.lulu_print_job_id) {
    return { ok: true, luluPrintJobId: order.lulu_print_job_id };
  }

  await supabase
    .from("orders")
    .update({ status: "processing", updated_at: new Date().toISOString() })
    .eq("id", orderId);

  const { data: book } = await supabase
    .from("books")
    .select("id, title, page_count, page_tier, trim_size")
    .eq("id", order.book_id)
    .single();
  if (!book) {
    await setOrderError(supabase, orderId, "Book not found");
    return { ok: false, error: "Book not found" };
  }

  const { data: pages } = await supabase
    .from("pages")
    .select("outline_image_path, crop_rect, rotation_degrees")
    .eq("book_id", order.book_id)
    .order("position", { ascending: true });
  const pageRows = (pages ?? []).filter((p) => p.outline_image_path);
  if (pageRows.length < 2) {
    await setOrderError(supabase, orderId, "Book has fewer than 2 pages");
    return { ok: false, error: "Book has fewer than 2 pages" };
  }

  const { data: cover } = await supabase
    .from("covers")
    .select("image_path, crop_rect, rotation_degrees")
    .eq("book_id", order.book_id)
    .single();
  if (!cover?.image_path) {
    await setOrderError(supabase, orderId, "Cover not found");
    return { ok: false, error: "Cover not found" };
  }

  const interiorPageCount = pageRows.length;
  const trimCode = book.trim_size ?? "";
  const trimSizeId = getTrimSizeIdFromCode(trimCode);
  if (!trimSizeId) {
    await setOrderError(
      supabase,
      orderId,
      "Book trim size is missing or not supported for printing",
    );
    return { ok: false, error: "Invalid trim size for print" };
  }
  const dbPageCount = book.page_count ?? 0;
  if (interiorPageCount !== dbPageCount) {
    await setOrderError(
      supabase,
      orderId,
      `Interior page count (${interiorPageCount}) does not match book.page_count (${dbPageCount})`,
    );
    return { ok: false, error: "Page count mismatch" };
  }
  const pageTier = book.page_tier ?? dbPageCount;
  if (interiorPageCount !== pageTier) {
    await setOrderError(
      supabase,
      orderId,
      `Interior page count (${interiorPageCount}) does not match book.page_tier (${pageTier})`,
    );
    return { ok: false, error: "Page tier mismatch" };
  }

  const podPackageId = getPodPackageId(trimSizeId, interiorPageCount);

  let interiorPath: string;
  let coverPdfPath: string;

  try {
    const interiorPdfBytes = await generateInteriorPdf(
      supabase,
      pageRows,
      trimCode,
    );
    interiorPath = `orders/${orderId}/interior.pdf`;
    const { error: up1 } = await supabase.storage
      .from("pdfs")
      .upload(interiorPath, interiorPdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });
    if (up1) {
      await setOrderError(
        supabase,
        orderId,
        `Interior PDF upload: ${up1.message}`,
      );
      return { ok: false, error: up1.message };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await setOrderError(supabase, orderId, `Interior PDF: ${msg}`);
    return { ok: false, error: msg };
  }

  try {
    const dimensions = await getCoverDimensions(pageRows.length, podPackageId);
    const coverPdfBytes = await generateCoverPdf(
      supabase,
      cover.image_path,
      dimensions.widthPoints,
      dimensions.heightPoints,
      trimCode,
      cover.crop_rect ?? undefined,
      cover.rotation_degrees ?? undefined,
    );
    coverPdfPath = `orders/${orderId}/cover.pdf`;
    const { error: up2 } = await supabase.storage
      .from("pdfs")
      .upload(coverPdfPath, coverPdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });
    if (up2) {
      await setOrderError(
        supabase,
        orderId,
        `Cover PDF upload: ${up2.message}`,
      );
      return { ok: false, error: up2.message };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await setOrderError(supabase, orderId, `Cover PDF: ${msg}`);
    return { ok: false, error: msg };
  }

  await supabase
    .from("orders")
    .update({
      interior_pdf_path: interiorPath,
      cover_pdf_path: coverPdfPath,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  const interiorSigned = await supabase.storage
    .from("pdfs")
    .createSignedUrl(interiorPath, 3600);
  const coverSigned = await supabase.storage
    .from("pdfs")
    .createSignedUrl(coverPdfPath, 3600);
  if (!interiorSigned.data?.signedUrl || !coverSigned.data?.signedUrl) {
    await setOrderError(
      supabase,
      orderId,
      "Could not create signed URLs for Lulu",
    );
    return { ok: false, error: "Signed URLs failed" };
  }

  try {
    const luluId = await createPrintJob({
      contactEmail: CONTACT_EMAIL,
      externalId: orderId,
      title: book.title ?? "My Coloring Book",
      interiorPdfUrl: interiorSigned.data.signedUrl,
      coverPdfUrl: coverSigned.data.signedUrl,
      podPackageId,
      shippingAddress: {
        name: order.shipping_name ?? "",
        street1: order.shipping_address_line1 ?? "",
        street2: order.shipping_address_line2 ?? undefined,
        city: order.shipping_city ?? "",
        state_code: order.shipping_state ?? "",
        country_code: order.shipping_country ?? "US",
        postcode: order.shipping_postal_code ?? "",
        phone_number: order.shipping_phone ?? "",
      },
      shippingLevel:
        (order.shipping_level as "MAIL" | "PRIORITY_MAIL" | "EXPEDITED") ??
        "MAIL",
      quantity: 1,
    });

    await supabase
      .from("orders")
      .update({
        lulu_print_job_id: luluId,
        status: "submitted_to_print",
        lulu_status: "CREATED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    return { ok: true, luluPrintJobId: luluId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await setOrderError(supabase, orderId, `Lulu: ${msg}`);
    return { ok: false, error: msg };
  }
}

async function setOrderError(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  orderId: string,
  errorMessage: string,
): Promise<void> {
  await supabase
    .from("orders")
    .update({
      status: "error",
      error_message: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);
}
