import type { SupabaseClient } from "@supabase/supabase-js";
import { getEmailForUserId } from "@/lib/email";

type AnyRow = Record<string, unknown>;

export async function getAdminUserCockpitData(
  supabase: SupabaseClient,
  userId: string,
): Promise<{
  user: {
    user_id: string;
    email: string | null;
    free_conversions_remaining: number;
    paid_credits: number;
    created_at: string;
    updated_at: string;
  };
  orders: AnyRow[];
  books: AnyRow[];
  conversions: AnyRow[];
  content: AnyRow[];
  events: AnyRow[];
}> {
  const { data: userProfile, error: userError } = await supabase
    .from("user_profiles")
    .select("user_id, free_conversions_remaining, paid_credits, created_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (userError) throw new Error(userError.message);
  if (!userProfile) throw new Error("USER_NOT_FOUND");

  const email = await getEmailForUserId(userId);

  const { data: ordersRaw, error: ordersError } = await supabase
    .from("orders")
    .select(
      "id, book_id, user_id, status, lulu_status, stripe_checkout_session_id, stripe_payment_intent_id, stripe_refund_id, lulu_print_job_id, amount_total, currency, shipping_name, shipping_city, shipping_state, shipping_country, shipping_level, lulu_tracking_id, lulu_tracking_url, error_message, created_at, updated_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (ordersError) throw new Error(ordersError.message);
  const orders = ordersRaw ?? [];

  const { data: booksRaw, error: booksError } = await supabase
    .from("books")
    .select("id, title, status, trim_size, page_count, page_tier, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (booksError) throw new Error(booksError.message);

  const books = await Promise.all(
    (booksRaw ?? []).map(async (book) => {
      const [{ count: pagesCount }, { data: cover }] = await Promise.all([
        supabase
          .from("pages")
          .select("id", { count: "exact", head: true })
          .eq("book_id", book.id),
        supabase
          .from("covers")
          .select("id, image_path")
          .eq("book_id", book.id)
          .maybeSingle(),
      ]);
      return {
        ...book,
        pages_count: pagesCount ?? 0,
        has_cover: !!cover?.id,
      };
    }),
  );

  const { data: conversionsRaw, error: conversionsError } = await supabase
    .from("saved_conversions")
    .select(
      "id, user_id, conversion_context, provider, provider_cost_cents, conversion_error, original_image_path, outline_image_path, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (conversionsError) throw new Error(conversionsError.message);
  const conversions = conversionsRaw ?? [];

  const content = await Promise.all(
    conversions.slice(0, 24).map(async (conversion) => {
      const original = await supabase.storage
        .from("originals")
        .createSignedUrl(String(conversion.original_image_path), 60 * 30);
      const outline = await supabase.storage
        .from("outlines")
        .createSignedUrl(String(conversion.outline_image_path), 60 * 30);
      return {
        ...conversion,
        original_url: original.data?.signedUrl ?? null,
        outline_url: outline.data?.signedUrl ?? null,
      };
    }),
  );

  const { data: eventsRaw, error: eventsError } = await supabase
    .from("integration_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (eventsError) throw new Error(eventsError.message);

  const orderIds = new Set(orders.map((o) => String(o.id)));
  const stripeSessionIds = new Set(
    orders
      .map((o) => o.stripe_checkout_session_id)
      .filter((value): value is string => typeof value === "string" && value.length > 0),
  );
  const stripePaymentIds = new Set(
    orders
      .map((o) => o.stripe_payment_intent_id)
      .filter((value): value is string => typeof value === "string" && value.length > 0),
  );
  const luluJobIds = new Set(
    orders
      .map((o) => o.lulu_print_job_id)
      .filter((value): value is number => typeof value === "number"),
  );

  const events = (eventsRaw ?? []).filter((event) => {
    const orderMatch = event.order_id && orderIds.has(String(event.order_id));
    const stripeSessionMatch =
      event.stripe_session_id && stripeSessionIds.has(String(event.stripe_session_id));
    const stripePaymentMatch =
      event.stripe_payment_intent_id &&
      stripePaymentIds.has(String(event.stripe_payment_intent_id));
    const luluMatch =
      typeof event.lulu_print_job_id === "number" &&
      luluJobIds.has(event.lulu_print_job_id);
    return orderMatch || stripeSessionMatch || stripePaymentMatch || luluMatch;
  });

  return {
    user: {
      user_id: userProfile.user_id,
      email,
      free_conversions_remaining: userProfile.free_conversions_remaining ?? 0,
      paid_credits: userProfile.paid_credits ?? 0,
      created_at: userProfile.created_at,
      updated_at: userProfile.updated_at,
    },
    orders,
    books,
    conversions,
    content,
    events,
  };
}
