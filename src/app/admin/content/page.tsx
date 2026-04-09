import Image from "next/image";
import { createServerSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("saved_conversions")
    .select("id, user_id, original_image_path, outline_image_path, created_at")
    .order("created_at", { ascending: false })
    .limit(24);

  const rows = await Promise.all(
    (data ?? []).map(async (row) => {
      const original = await supabase.storage
        .from("originals")
        .createSignedUrl(row.original_image_path, 60 * 30);
      const outline = await supabase.storage
        .from("outlines")
        .createSignedUrl(row.outline_image_path, 60 * 30);
      return {
        ...row,
        originalUrl: original.data?.signedUrl ?? null,
        outlineUrl: outline.data?.signedUrl ?? null,
      };
    }),
  );

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Images / content</h1>
        <p className="text-sm text-muted-foreground">
          Support-only preview links (signed URLs expire quickly).
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((row) => (
          <div key={row.id} className="space-y-2 rounded-md border p-3 text-sm">
            <div className="font-mono text-xs">{row.user_id}</div>
            <div className="text-xs text-muted-foreground">{row.id}</div>
            <div className="flex gap-3">
              {row.originalUrl ? (
                <Image
                  alt="Original upload"
                  src={row.originalUrl}
                  width={160}
                  height={160}
                  className="h-40 w-40 rounded object-cover"
                />
              ) : (
                <div className="h-40 w-40 rounded bg-muted" />
              )}
              {row.outlineUrl ? (
                <Image
                  alt="Generated outline"
                  src={row.outlineUrl}
                  width={160}
                  height={160}
                  className="h-40 w-40 rounded object-cover"
                />
              ) : (
                <div className="h-40 w-40 rounded bg-muted" />
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
