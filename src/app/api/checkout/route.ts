import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getStripe, CREDIT_PACKAGES, type CreditPackageType } from "@/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabase";
import { calculateBookPrice, type ShippingLevelId } from "@/lib/pricing";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    type: string;
    package_type?: string;
    book_id?: string;
    shipping?: {
      name: string;
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
      phone: string;
    };
    shipping_level?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.type === "credit") {
    const pkg = body.package_type as CreditPackageType | undefined;
    if (!pkg || !CREDIT_PACKAGES[pkg]) {
      return NextResponse.json(
        { error: "Invalid package_type. Use single, pack_50, or pack_100" },
        { status: 400 }
      );
    }
    const config = CREDIT_PACKAGES[pkg];
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: config.amount,
            product_data: { name: config.name },
          },
          quantity: config.quantity,
        },
      ],
      success_url: `${APP_URL}/dashboard/buy-credits?success=1`,
      cancel_url: `${APP_URL}/dashboard/buy-credits`,
      metadata: {
        type: "credit_purchase",
        userId,
        package_type: pkg,
      },
    });
    return NextResponse.json({ url: session.url });
  }

  if (body.type === "book") {
    const bookId = body.book_id;
    const shipping = body.shipping;
    const shippingLevel = (body.shipping_level ?? "MAIL") as ShippingLevelId;
    if (!bookId || !shipping?.name || !shipping?.line1 || !shipping?.city || !shipping?.state || !shipping?.postal_code || !shipping?.country || !shipping?.phone) {
      return NextResponse.json(
        { error: "Missing book_id or shipping fields (name, line1, city, state, postal_code, country, phone)" },
        { status: 400 }
      );
    }
    const supabase = createServerSupabaseClient();
    const { data: book, error: bookErr } = await supabase
      .from("books")
      .select("id, page_count, credits_applied_value_cents")
      .eq("id", bookId)
      .eq("user_id", userId)
      .single();
    if (bookErr || !book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }
    const pageCount = book.page_count ?? 0;
    const creditsApplied = book.credits_applied_value_cents ?? 0;
    if (pageCount < 2) {
      return NextResponse.json({ error: "Book must have at least 2 pages" }, { status: 400 });
    }
    const { totalCents } = calculateBookPrice(pageCount, shippingLevel, creditsApplied);
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: totalCents,
            product_data: {
              name: "Coloring Book",
              description: `${pageCount} pages`,
            },
          },
          quantity: 1,
        },
      ],
      automatic_tax: { enabled: true },
      success_url: `${APP_URL}/order/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/dashboard/books/${bookId}/preview`,
      metadata: {
        type: "book_order",
        bookId,
        userId,
        pageCount: String(pageCount),
        shipping_level: shippingLevel,
        shipping_name: shipping.name,
        shipping_line1: shipping.line1,
        shipping_line2: shipping.line2 ?? "",
        shipping_city: shipping.city,
        shipping_state: shipping.state,
        shipping_postal_code: shipping.postal_code,
        shipping_country: shipping.country,
        shipping_phone: shipping.phone,
        credits_applied_value_cents: String(creditsApplied),
      },
    });
    return NextResponse.json({ url: session.url });
  }

  return NextResponse.json(
    { error: "Unknown checkout type. Use type: credit or type: book" },
    { status: 400 }
  );
}
