import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { BookEditorClient } from "./book-editor-client";
import { DeleteBookButton } from "./delete-book-button";

export default async function BookEditorPage({
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
    .select("*")
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
    .select(
      "id, position, outline_image_path, conversion_status, crop_rect, rotation_degrees",
    )
    .eq("book_id", bookId)
    .order("position", { ascending: true });

  const pagesWithUrls = await Promise.all(
    (pages ?? []).map(async (p) => {
      const { data: signed } = await supabase.storage
        .from("outlines")
        .createSignedUrl(p.outline_image_path, 3600);
      return { ...p, outline_url: signed?.signedUrl ?? null };
    }),
  );

  const { data: cover } = await supabase
    .from("covers")
    .select("id, image_path, crop_rect, rotation_degrees")
    .eq("book_id", bookId)
    .single();

  let initialCover: {
    id: string;
    image_path: string;
    crop_rect?: {
      x?: number;
      y?: number;
      width?: number;
      height?: number;
    } | null;
    rotation_degrees?: number | null;
    cover_url?: string | null;
  } | null = cover ?? null;
  if (cover?.image_path) {
    const { data: coverSigned } = await supabase.storage
      .from("covers")
      .createSignedUrl(cover.image_path, 3600);
    initialCover = { ...cover, cover_url: coverSigned?.signedUrl ?? null };
  }

  return (
    <div className="relative space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold text-foreground">
          Book Editor
        </h1>
      </div>

      <DeleteBookButton bookId={bookId} />
      {/* Book Editor Client */}
      <BookEditorClient
        bookId={bookId}
        initialBook={book}
        initialPages={pagesWithUrls}
        initialCover={initialCover}
      />
    </div>
  );
}
