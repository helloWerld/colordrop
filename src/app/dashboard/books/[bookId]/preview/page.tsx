import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import type { CropRectInput } from "@/components/crop-rotate-editor";
import { getProductByTrimCode } from "@/lib/book-products";
import { createServerSupabaseClient } from "@/lib/supabase";
import { PreviewClient } from "./preview-client";

export default async function BookPreviewPage({
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
    .select("id, title, page_count, trim_size")
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

  const { data: pages } = await supabase
    .from("pages")
    .select("id, position, outline_image_path, crop_rect, rotation_degrees")
    .eq("book_id", bookId)
    .order("position", { ascending: true });

  const { data: cover } = await supabase
    .from("covers")
    .select("id, image_path, crop_rect, rotation_degrees")
    .eq("book_id", bookId)
    .single();

  const product = book.trim_size ? getProductByTrimCode(book.trim_size) : null;
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

  const previewPages: {
    url: string;
    crop_rect: CropRectInput;
    rotation_degrees: number | null;
  }[] = [];
  for (const p of pages ?? []) {
    const { data: d } = await supabase.storage
      .from("outlines")
      .createSignedUrl(p.outline_image_path, 3600);
    if (d?.signedUrl) {
      previewPages.push({
        url: d.signedUrl,
        crop_rect: (p.crop_rect as CropRectInput) ?? null,
        rotation_degrees: p.rotation_degrees ?? null,
      });
    }
  }

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6">
      <div>
        <Link
          href={`/dashboard/books/${bookId}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Edit Book
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold text-foreground">
          Book Preview
        </h1>
      </div>
      <PreviewClient
        bookId={bookId}
        title={book.title ?? "My Coloring Book"}
        coverUrl={coverUrl}
        coverCropRect={cover?.crop_rect ?? null}
        coverRotation={cover?.rotation_degrees ?? null}
        trimAspectRatio={trimAspectRatio}
        previewPages={previewPages}
        pageCount={book.page_count ?? 0}
      />
    </div>
  );
}
