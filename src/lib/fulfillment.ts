/**
 * Post-payment fulfillment: generate PDFs, upload to storage, create Lulu print job.
 * Called from Stripe webhook after order is created.
 */

import { createServerSupabaseClient } from "@/lib/supabase";
import { generateInteriorPdf, generateCoverPdf } from "@/lib/pdf";
import { getCoverDimensions } from "@/lib/lulu";
import {
  getPodPackageId,
  getTrimSizeIdFromCode,
} from "@/lib/book-products";
import { handleTerminalFulfillmentFailure } from "@/lib/fulfillment-failure";
import type { FulfillmentFailurePhase } from "@/lib/fulfillment-failure";
import { createPrintJobWithRetries } from "@/lib/lulu-print-job-retry";
import {
  parsePrintSnapshot,
  snapshotPagesToPageRows,
  validatePrintSnapshotForFulfillment,
} from "@/lib/print-snapshot";
import type { PageRow } from "@/lib/pdf";
import { logIntegrationEvent } from "@/lib/integration-events";

const CONTACT_EMAIL =
  process.env.LULU_CONTACT_EMAIL ??
  process.env.RESEND_FROM_EMAIL ??
  "orders@colordrop.ai";

export type FulfillmentResult =
  | { ok: true; luluPrintJobId: number }
  | { ok: false; error: string };

type OrderRow = {
  id: string;
  book_id: string;
  user_id: string;
  stripe_payment_intent_id: string | null;
  interior_pdf_path: string | null;
  cover_pdf_path: string | null;
  lulu_print_job_id: number | null;
  print_snapshot: unknown | null;
  shipping_name: string | null;
  shipping_address_line1: string | null;
  shipping_address_line2: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_postal_code: string | null;
  shipping_country: string | null;
  shipping_phone: string | null;
  shipping_level: string | null;
};

export async function runFulfillment(
  orderId: string,
): Promise<FulfillmentResult> {
  const supabase = createServerSupabaseClient();

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select(
      "id, book_id, user_id, status, interior_pdf_path, cover_pdf_path, lulu_print_job_id, stripe_payment_intent_id, print_snapshot, shipping_name, shipping_address_line1, shipping_address_line2, shipping_city, shipping_state, shipping_postal_code, shipping_country, shipping_phone, shipping_level",
    )
    .eq("id", orderId)
    .single();

  if (orderErr || !order) {
    return { ok: false, error: "Order not found" };
  }
  const o = order as OrderRow;
  if (o.lulu_print_job_id) {
    return { ok: true, luluPrintJobId: o.lulu_print_job_id };
  }

  await supabase
    .from("orders")
    .update({ status: "processing", updated_at: new Date().toISOString() })
    .eq("id", orderId);
  await logIntegrationEvent(
    {
      provider: "system",
      eventType: "fulfillment.started",
      severity: "info",
      status: "processing",
      orderId,
      bookId: o.book_id,
    },
    supabase,
  );

  const parsedSnapshot =
    o.print_snapshot != null ? parsePrintSnapshot(o.print_snapshot) : null;
  if (o.print_snapshot != null && !parsedSnapshot) {
    return fail(
      supabase,
      o,
      "My Coloring Book",
      "pre_lulu",
      "Order print_snapshot is invalid or unsupported",
    );
  }

  let bookTitle: string;
  let trimCode: string;
  let pageRows: PageRow[];
  let cover: {
    image_path: string;
    crop_rect?: {
      x?: number;
      y?: number;
      width?: number;
      height?: number;
    } | null;
    rotation_degrees?: number | null;
  };

  if (parsedSnapshot) {
    const vErr = validatePrintSnapshotForFulfillment(parsedSnapshot);
    if (vErr) {
      return fail(
        supabase,
        o,
        parsedSnapshot.book.title ?? "My Coloring Book",
        "pre_lulu",
        vErr,
      );
    }
    bookTitle = parsedSnapshot.book.title;
    trimCode = parsedSnapshot.book.trim_size ?? "";
    pageRows = snapshotPagesToPageRows(parsedSnapshot);
    cover = {
      image_path: parsedSnapshot.cover.image_path,
      crop_rect: parsedSnapshot.cover.crop_rect ?? null,
      rotation_degrees: parsedSnapshot.cover.rotation_degrees ?? null,
    };
  } else {
    const { data: book } = await supabase
      .from("books")
      .select("id, title, page_count, page_tier, trim_size")
      .eq("id", o.book_id)
      .single();
    bookTitle = book?.title ?? "My Coloring Book";

    if (!book) {
      return fail(supabase, o, bookTitle, "pre_lulu", "Book not found");
    }

    const { data: pages } = await supabase
      .from("pages")
      .select("outline_image_path, crop_rect, rotation_degrees")
      .eq("book_id", o.book_id)
      .order("position", { ascending: true });
    pageRows = (pages ?? []).filter((p) => p.outline_image_path);
    if (pageRows.length < 2) {
      return fail(
        supabase,
        o,
        bookTitle,
        "pre_lulu",
        "Book has fewer than 2 pages",
      );
    }

    const { data: coverRow } = await supabase
      .from("covers")
      .select("image_path, crop_rect, rotation_degrees")
      .eq("book_id", o.book_id)
      .single();
    if (!coverRow?.image_path) {
      return fail(supabase, o, bookTitle, "pre_lulu", "Cover not found");
    }
    cover = coverRow;

    const interiorPageCountLegacy = pageRows.length;
    const trimCodeLegacy = book.trim_size ?? "";
    const trimSizeIdLegacy = getTrimSizeIdFromCode(trimCodeLegacy);
    if (!trimSizeIdLegacy) {
      return fail(
        supabase,
        o,
        bookTitle,
        "pre_lulu",
        "Book trim size is missing or not supported for printing",
      );
    }
    const dbPageCount = book.page_count ?? 0;
    if (interiorPageCountLegacy !== dbPageCount) {
      return fail(
        supabase,
        o,
        bookTitle,
        "pre_lulu",
        `Interior page count (${interiorPageCountLegacy}) does not match book.page_count (${dbPageCount})`,
      );
    }
    const pageTier = book.page_tier ?? dbPageCount;
    if (interiorPageCountLegacy !== pageTier) {
      return fail(
        supabase,
        o,
        bookTitle,
        "pre_lulu",
        `Interior page count (${interiorPageCountLegacy}) does not match book.page_tier (${pageTier})`,
      );
    }
    trimCode = trimCodeLegacy;
  }

  const interiorPageCount = pageRows.length;
  const trimSizeId = getTrimSizeIdFromCode(trimCode);
  if (!trimSizeId) {
    return fail(
      supabase,
      o,
      bookTitle,
      "pre_lulu",
      "Book trim size is missing or not supported for printing",
    );
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
      return fail(
        supabase,
        o,
        bookTitle,
        "pre_lulu",
        `Interior PDF upload: ${up1.message}`,
      );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return fail(supabase, o, bookTitle, "pre_lulu", `Interior PDF: ${msg}`);
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
      return fail(
        supabase,
        o,
        bookTitle,
        "pre_lulu",
        `Cover PDF upload: ${up2.message}`,
      );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return fail(supabase, o, bookTitle, "pre_lulu", `Cover PDF: ${msg}`);
  }

  await supabase
    .from("orders")
    .update({
      interior_pdf_path: interiorPath,
      cover_pdf_path: coverPdfPath,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  const shippingLevel =
    (o.shipping_level as CreatePrintJobShippingLevel) ?? "MAIL";

  try {
    const luluId = await createPrintJobWithRetries(
      supabase,
      interiorPath,
      coverPdfPath,
      {
        contactEmail: CONTACT_EMAIL,
        externalId: orderId,
        title: bookTitle,
        podPackageId,
        shippingAddress: {
          name: o.shipping_name ?? "",
          street1: o.shipping_address_line1 ?? "",
          street2: o.shipping_address_line2 ?? undefined,
          city: o.shipping_city ?? "",
          state_code: o.shipping_state ?? "",
          country_code: o.shipping_country ?? "US",
          postcode: o.shipping_postal_code ?? "",
          phone_number: o.shipping_phone ?? "",
        },
        shippingLevel,
        quantity: 1,
      },
    );

    await supabase
      .from("orders")
      .update({
        lulu_print_job_id: luluId,
        status: "submitted_to_print",
        lulu_status: "CREATED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);
    await logIntegrationEvent(
      {
        provider: "lulu",
        eventType: "fulfillment.submitted_to_print",
        severity: "info",
        status: "submitted_to_print",
        orderId,
        bookId: o.book_id,
        luluPrintJobId: luluId,
      },
      supabase,
    );

    return { ok: true, luluPrintJobId: luluId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return fail(supabase, o, bookTitle, "lulu", `Lulu: ${msg}`);
  }
}

type CreatePrintJobShippingLevel =
  | "MAIL"
  | "PRIORITY_MAIL"
  | "GROUND"
  | "EXPEDITED"
  | "EXPRESS";

async function fail(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  order: OrderRow,
  bookTitle: string,
  phase: FulfillmentFailurePhase,
  errorMessage: string,
): Promise<FulfillmentResult> {
  await handleTerminalFulfillmentFailure(supabase, {
    orderId: order.id,
    bookId: order.book_id,
    userId: order.user_id,
    stripePaymentIntentId: order.stripe_payment_intent_id,
    bookTitle,
    phase,
    errorMessage,
  });
  return { ok: false, error: errorMessage };
}
