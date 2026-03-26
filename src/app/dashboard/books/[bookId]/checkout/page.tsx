import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase";
import { SHIPPING_LEVELS } from "@/lib/pricing";
import { getProductByTrimCode } from "@/lib/book-products";
import { isLuluSandbox } from "@/lib/lulu";
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
    .select("id, title, page_count, trim_size, page_tier")
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

  if (!book.trim_size) {
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
        <div
          className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm"
          role="alert"
        >
          <p className="font-medium text-foreground">
            This book has no print size configured
          </p>
          <p className="mt-2 text-muted-foreground">
            Choose a book size in the editor before checkout.
          </p>
        </div>
      </div>
    );
  }

  const pageCount = book.page_count ?? 0;
  const product = getProductByTrimCode(book.trim_size);
  const bookSizeLabel = product
    ? `${product.label} ${product.widthInches}" × ${product.heightInches}"`
    : `${pageCount} pages`;

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
        bookSizeLabel={bookSizeLabel}
        pageCount={pageCount}
        luluSandbox={isLuluSandbox()}
        shippingOptions={SHIPPING_LEVELS}
      />
    </div>
  );
}
