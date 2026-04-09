import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getStripe,
  CREDIT_PACKAGES,
  type CreditPackageType,
} from "@/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabase";
import {
  calculateBookPriceFromTrimCodeAsync,
  type ShippingLevelId,
} from "@/lib/pricing";
import { isLuluSandbox, shippingFormToLuluCostAddress } from "@/lib/lulu";
import { shippingAddressSchema } from "@/lib/validators";
import {
  DUPLICATE_BOOK_CHECKOUT_ERROR,
  isBookEligibleForCheckout,
} from "@/lib/book-checkout-eligibility";

/** Prefer the request origin so local dev matches the browser without flipping env. */
function appBaseUrl(request: Request): string {
  try {
    const origin = new URL(request.url).origin;
    if (origin) return origin;
  } catch {
    /* ignore */
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUrl = appBaseUrl(request);

  const clerkUser = await currentUser();
  const customerEmail =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses?.[0]?.emailAddress;

  let body: {
    type: string;
    package_type?: string;
    quantity?: number;
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
        { status: 400 },
      );
    }
    const config = CREDIT_PACKAGES[pkg];
    let quantity: number;
    let unitAmount: number;
    let productName: string;
    if (pkg === "single") {
      const q =
        typeof body.quantity === "number"
          ? body.quantity
          : parseInt(String(body.quantity ?? 1), 10);
      if (!Number.isInteger(q) || q < 1 || q > 49) {
        return NextResponse.json(
          { error: "For single credits, quantity must be between 1 and 49" },
          { status: 400 },
        );
      }
      quantity = q;
      unitAmount = config.amount;
      productName = q === 1 ? "1 Conversion Credit" : `${q} Conversion Credits`;
    } else {
      quantity = 1;
      unitAmount = config.amount;
      productName = config.name;
    }
    const stripe = getStripe();
    const metadata: Record<string, string> = {
      type: "credit_purchase",
      userId,
      package_type: pkg,
    };
    if (pkg === "single") {
      metadata.credit_quantity = String(quantity);
    }
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: unitAmount,
            product_data: { name: productName },
          },
          quantity,
        },
      ],
      success_url: `${appUrl}/dashboard/buy-credits?success=1`,
      cancel_url: `${appUrl}/dashboard/buy-credits`,
      metadata,
    });
    return NextResponse.json({ url: session.url });
  }

  if (body.type === "book") {
    const bookId = body.book_id;
    const shipping = body.shipping;
    const shippingLevel = (body.shipping_level ?? "MAIL") as ShippingLevelId;
    if (!bookId) {
      return NextResponse.json({ error: "Missing book_id" }, { status: 400 });
    }
    const shipParsed = shippingAddressSchema.safeParse(shipping);
    if (!shipParsed.success) {
      return NextResponse.json(
        {
          error:
            "Missing or invalid shipping (name, line1, city, state, postal_code, country, phone)",
          detail: shipParsed.error.flatten(),
        },
        { status: 400 },
      );
    }
    const shippingData = shipParsed.data;
    const luluShippingAddress = shippingFormToLuluCostAddress(shippingData);
    const supabase = createServerSupabaseClient();
    const { data: book, error: bookErr } = await supabase
      .from("books")
      .select("id, page_count, page_tier, trim_size, status")
      .eq("id", bookId)
      .eq("user_id", userId)
      .single();
    if (bookErr || !book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const { data: existingOrderRow } = await supabase
      .from("orders")
      .select("id, status")
      .eq("book_id", bookId)
      .limit(1)
      .maybeSingle();

    if (
      !isBookEligibleForCheckout(book.status, existingOrderRow ?? undefined)
    ) {
      return NextResponse.json(
        { error: DUPLICATE_BOOK_CHECKOUT_ERROR },
        { status: 409 },
      );
    }
    const pageCount = book.page_count ?? 0;
    const pageTier = book.page_tier ?? 24;
    const trimCode = book.trim_size ?? "";

    if (pageCount !== pageTier) {
      return NextResponse.json(
        {
          error: `Book must have exactly ${pageTier} pages (${pageTier} images) to checkout. Add or remove pages to match.`,
        },
        { status: 400 },
      );
    }
    if (pageCount < 2) {
      return NextResponse.json(
        { error: "Book must have at least 2 pages" },
        { status: 400 },
      );
    }

    const priced = await calculateBookPriceFromTrimCodeAsync(
      trimCode,
      pageTier,
      shippingLevel,
      luluShippingAddress,
    );
    if (!priced.ok) {
      return NextResponse.json(
        {
          error:
            "Pricing is temporarily unavailable. Try reloading the page or contact support.",
          detail: priced.error,
        },
        { status: 503 },
      );
    }
    const p = priced.pricing;
    const bookCents = p.bookCents;
    const shippingCents = p.shippingCents;

    const stripe = getStripe();

    const stripeAddress = {
      line1: shippingData.line1,
      ...(shippingData.line2 ? { line2: shippingData.line2 } : {}),
      city: shippingData.city,
      state: shippingData.state,
      postal_code: shippingData.postal_code,
      country: shippingData.country,
    };

    const customer = await stripe.customers.create({
      ...(customerEmail ? { email: customerEmail } : {}),
      name: shippingData.name,
      phone: shippingData.phone,
      address: stripeAddress,
      shipping: {
        name: shippingData.name,
        phone: shippingData.phone,
        address: stripeAddress,
      },
      metadata: { userId, bookId },
    });

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: bookCents,
            product_data: {
              name: "Book (printing & binding)",
              description: `${pageCount} pages (${pageCount} images). Printed double-sided.`,
            },
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: "usd",
            unit_amount: shippingCents,
            product_data: {
              name: "Shipping",
              description: `Delivery (${shippingLevel.replace(/_/g, " ")})`,
            },
          },
          quantity: 1,
        },
      ],
      automatic_tax: { enabled: process.env.NODE_ENV === "production" },
      success_url: `${appUrl}/order/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/books/${bookId}/preview`,
      metadata: {
        type: "book_order",
        bookId,
        userId,
        pageCount: String(pageCount),
        page_tier: String(pageTier),
        trim_size: trimCode,
        shipping_level: shippingLevel,
        shipping_name: shippingData.name,
        shipping_line1: shippingData.line1,
        shipping_line2: shippingData.line2 ?? "",
        shipping_city: shippingData.city,
        shipping_state: shippingData.state,
        shipping_postal_code: shippingData.postal_code,
        shipping_country: shippingData.country,
        shipping_phone: shippingData.phone,
        book_markup_percent: String(priced.pricing.bookMarkupPercent),
        shipping_markup_percent: String(priced.pricing.shippingMarkupPercent),
        lulu_sandbox: isLuluSandbox() ? "true" : "false",
      },
    });
    return NextResponse.json({ url: session.url });
  }

  return NextResponse.json(
    { error: "Unknown checkout type. Use type: credit or type: book" },
    { status: 400 },
  );
}
