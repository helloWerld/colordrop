import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase";
import { calculateBookPrice, SHIPPING_LEVELS } from "@/lib/pricing";
import { CheckoutForm } from "./checkout-form";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) return null;

  const { bookId } = await params;
  const supabase = createServerSupabaseClient();
  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("id, title, page_count, credits_applied_value_cents")
    .eq("id", bookId)
    .eq("user_id", userId)
    .single();

  if (bookError || !book) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">Book not found.</p>
        <Link href="/dashboard" className="text-primary hover:underline">
          ← Dashboard
        </Link>
      </div>
    );
  }

  const pageCount = book.page_count ?? 0;
  const creditsApplied = book.credits_applied_value_cents ?? 0;
  const defaultLevel = "MAIL" as const;
  const breakdown = calculateBookPrice(pageCount, defaultLevel, creditsApplied);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/dashboard/books/${bookId}/preview`}
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Preview
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold text-foreground">
          Checkout
        </h1>
      </div>
      <CheckoutForm
        bookId={bookId}
        bookTitle={book.title ?? "My Coloring Book"}
        pageCount={pageCount}
        defaultBreakdown={breakdown}
        shippingOptions={SHIPPING_LEVELS}
      />
    </div>
  );
}
