import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrCreateUserProfile } from "@/lib/db";
import { createServerSupabaseClient } from "@/lib/supabase";
import { DeleteAccountSection } from "./delete-account-section";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  let profile;
  let draftBooks: { id: string; title: string | null; page_count: number | null; updated_at: string | null }[] | null;
  let orders: { id: string; book_id: string; amount_total: number | null; status: string | null; created_at: string | null }[] | null;

  try {
    profile = await getOrCreateUserProfile(userId);
    const supabase = createServerSupabaseClient();
    const [booksRes, ordersRes] = await Promise.all([
      supabase
        .from("books")
        .select("id, title, page_count, updated_at")
        .eq("user_id", userId)
        .eq("status", "draft")
        .order("updated_at", { ascending: false })
        .limit(10),
      supabase
        .from("orders")
        .select("id, book_id, amount_total, status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);
    draftBooks = booksRes.data ?? null;
    orders = ordersRes.data ?? null;
  } catch (err) {
    console.error("[Dashboard] Failed to load data:", err);
    throw err instanceof Error ? err : new Error("Failed to load dashboard. Check server logs and env (Supabase).");
  }

  const freeRemaining = profile.free_conversions_remaining ?? 0;
  const creditsSingle = profile.credits_single ?? 0;
  const credits50 = profile.credits_pack_50 ?? 0;
  const credits100 = profile.credits_pack_100 ?? 0;
  const totalPurchased = creditsSingle + credits50 + credits100;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Hi! 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          Welcome to your dashboard. Create a book or convert a photo.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h2 className="font-heading text-sm font-semibold text-foreground">
          Conversion credits
        </h2>
        <p className="mt-2 text-2xl font-bold text-primary">
          {freeRemaining} free credits left
        </p>
        {totalPurchased > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            Plus {totalPurchased} purchased credits (1×{creditsSingle}, 50×{credits50}, 100×{credits100})
          </p>
        )}
        <Link
          href="/dashboard/buy-credits"
          className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
        >
          Buy Credits →
        </Link>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/dashboard/books/new"
          className="block rounded-2xl border-2 border-primary/50 bg-primary/5 p-6 font-heading text-lg font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary/10"
        >
          Create New Book
        </Link>
        <Link
          href="/dashboard/convert"
          className="block rounded-2xl border border-border bg-card p-6 font-heading text-lg font-semibold text-foreground shadow-sm hover:bg-muted/50"
        >
          Convert an Image
        </Link>
      </div>

      <div className="flex flex-wrap gap-4">
        <Link
          href="/dashboard/saved-pages"
          className="text-sm font-medium text-primary hover:underline"
        >
          My Saved Pages →
        </Link>
      </div>

      <section>
        <h2 className="font-heading text-lg font-semibold text-foreground">
          In-progress books
        </h2>
        {draftBooks && draftBooks.length > 0 ? (
          <div className="mt-2 flex gap-4 overflow-x-auto pb-2">
            {draftBooks.map((b) => (
              <Link
                key={b.id}
                href={`/dashboard/books/${b.id}`}
                className="flex min-w-[160px] flex-col rounded-xl border border-border bg-card p-4 shadow-sm hover:bg-muted/50"
              >
                <span className="font-medium text-foreground">{b.title}</span>
                <span className="text-sm text-muted-foreground">
                  {b.page_count} pages
                </span>
                <span className="mt-2 text-sm text-primary">Continue →</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-2 rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center text-muted-foreground">
            No in-progress books. Create your first book above.
          </div>
        )}
      </section>

      <section>
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Past orders
        </h2>
        {orders && orders.length > 0 ? (
          <div className="mt-2 flex gap-4 overflow-x-auto pb-2">
            {orders.map((o) => (
              <Link
                key={o.id}
                href={`/dashboard/orders/${o.id}`}
                className="flex min-w-[180px] flex-col rounded-xl border border-border bg-card p-4 shadow-sm hover:bg-muted/50"
              >
                <span className="text-sm font-medium text-foreground">
                  Order #{o.id.slice(0, 8)}
                </span>
                <span className="text-sm text-muted-foreground">
                  ${((o.amount_total ?? 0) / 100).toFixed(2)} · {o.status}
                </span>
                <span className="mt-2 text-sm text-primary">View →</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-2 rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center text-muted-foreground">
            No orders yet.
          </div>
        )}
      </section>

      <div className="rounded-2xl border border-border bg-muted/30 p-6 text-center">
        <p className="font-heading font-medium text-foreground">
          You have {freeRemaining} free conversions to try!
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Convert a photo or start a book.
        </p>
        <div className="mt-4 flex justify-center gap-4">
          <Link
            href="/dashboard/convert"
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Convert a Photo
          </Link>
          <Link
            href="/dashboard/books/new"
            className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/50"
          >
            Start a Book
          </Link>
        </div>
      </div>

      <DeleteAccountSection />
    </div>
  );
}
