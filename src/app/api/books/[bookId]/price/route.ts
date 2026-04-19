import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import {
  calculateBookPriceFromTrimCodeAsync,
  SHIPPING_LEVELS,
  type ShippingLevelId,
} from "@/lib/pricing";
import { isLuluSandbox, shippingFormToLuluCostAddress } from "@/lib/lulu";
import { bookPricePostSchema } from "@/lib/validators";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookId } = await params;
  const { searchParams } = new URL(request.url);
  const shippingLevel = (searchParams.get("shipping_level") ?? "MAIL") as
    | "MAIL"
    | "PRIORITY_MAIL"
    | "EXPEDITED";

  const supabase = createServerSupabaseClient();
  const { data: book, error } = await supabase
    .from("books")
    .select("id, page_count, trim_size, page_tier")
    .eq("id", bookId)
    .eq("user_id", userId)
    .single();

  if (error || !book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const pageCount = book.page_count ?? 0;
  const pageTier = book.page_tier ?? 24;
  const trimCode = book.trim_size ?? "";

  const result = await calculateBookPriceFromTrimCodeAsync(
    trimCode,
    pageTier,
    shippingLevel
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        error:
          "Pricing is temporarily unavailable. Try reloading the page or contact support.",
        detail: result.error,
        page_count: pageCount,
        page_tier: pageTier,
        trim_size: trimCode,
        shipping_level: shippingLevel,
        shipping_options: SHIPPING_LEVELS,
        luluSandbox: isLuluSandbox(),
      },
      { status: 503 }
    );
  }

  const { pricing, printingOnlyCents } = result;
  return NextResponse.json({
    page_count: pageCount,
    page_tier: pageTier,
    trim_size: trimCode,
    shipping_level: shippingLevel,
    shipping_options: SHIPPING_LEVELS,
    bookCents: pricing.bookCents,
    shippingCents: pricing.shippingCents,
    totalCents: pricing.totalCents,
    printingOnlyCents,
    luluLineItemCents: pricing.luluLineItemCents,
    luluFulfillmentCents: pricing.luluFulfillmentCents,
    luluShippingCents: pricing.luluShippingCents,
    luluTotalCostCents: pricing.luluTotalCostCents,
    bookMarkupPercent: pricing.bookMarkupPercent,
    shippingMarkupPercent: pricing.shippingMarkupPercent,
    marginMarkupCents: pricing.marginMarkupCents,
    luluSandbox: isLuluSandbox(),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookId } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bookPricePostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", detail: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { shipping_level: shippingLevel, ...shippingInput } = parsed.data;
  const luluAddress = shippingFormToLuluCostAddress(shippingInput);

  const supabase = createServerSupabaseClient();
  const { data: book, error } = await supabase
    .from("books")
    .select("id, page_count, trim_size, page_tier")
    .eq("id", bookId)
    .eq("user_id", userId)
    .single();

  if (error || !book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const pageCount = book.page_count ?? 0;
  const pageTier = book.page_tier ?? 24;
  const trimCode = book.trim_size ?? "";

  const levelIds = SHIPPING_LEVELS.map((l) => l.id) as ShippingLevelId[];
  const results = await Promise.all(
    levelIds.map((level) =>
      calculateBookPriceFromTrimCodeAsync(
        trimCode,
        pageTier,
        level,
        luluAddress
      )
    )
  );

  const failed = results.find((r) => !r.ok);
  if (failed && !failed.ok) {
    return NextResponse.json(
      {
        error:
          "Pricing is temporarily unavailable. Try reloading the page or contact support.",
        detail: failed.error,
        page_count: pageCount,
        page_tier: pageTier,
        trim_size: trimCode,
        shipping_level: shippingLevel,
        shipping_options: SHIPPING_LEVELS,
        luluSandbox: isLuluSandbox(),
      },
      { status: 503 }
    );
  }

  const shipping_quotes = Object.fromEntries(
    levelIds.map((id, i) => {
      const row = results[i];
      if (!row.ok) throw new Error("unreachable");
      const { pricing } = row;
      return [
        id,
        {
          bookCents: pricing.bookCents,
          shippingCents: pricing.shippingCents,
          totalCents: pricing.totalCents,
        },
      ];
    })
  ) as Record<
    ShippingLevelId,
    { bookCents: number; shippingCents: number; totalCents: number }
  >;

  const selectedIndex = levelIds.indexOf(shippingLevel);
  const selected = results[selectedIndex >= 0 ? selectedIndex : 0];
  if (!selected.ok) throw new Error("unreachable");
  const { pricing, printingOnlyCents } = selected;

  return NextResponse.json({
    page_count: pageCount,
    page_tier: pageTier,
    trim_size: trimCode,
    shipping_level: shippingLevel,
    shipping_options: SHIPPING_LEVELS,
    shipping_quotes,
    bookCents: pricing.bookCents,
    shippingCents: pricing.shippingCents,
    totalCents: pricing.totalCents,
    printingOnlyCents,
    luluLineItemCents: pricing.luluLineItemCents,
    luluFulfillmentCents: pricing.luluFulfillmentCents,
    luluShippingCents: pricing.luluShippingCents,
    luluTotalCostCents: pricing.luluTotalCostCents,
    bookMarkupPercent: pricing.bookMarkupPercent,
    shippingMarkupPercent: pricing.shippingMarkupPercent,
    marginMarkupCents: pricing.marginMarkupCents,
    luluSandbox: isLuluSandbox(),
  });
}
