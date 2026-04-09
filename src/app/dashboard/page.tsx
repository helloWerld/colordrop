import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrCreateUserProfile } from "@/lib/db";
import { createServerSupabaseClient } from "@/lib/supabase";
import { DeleteAccountSection } from "./delete-account-section";
import { AddTestCreditsButton } from "./add-test-credits-button";
import { DraftBookCard } from "./draft-book-card";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  let profile;
  let draftBooks:
    | {
        id: string;
        title: string | null;
        page_count: number | null;
        page_tier: number | null;
        updated_at: string | null;
        trim_size: string | null;
      }[]
    | null;
  let orders:
    | {
        id: string;
        book_id: string;
        amount_total: number | null;
        status: string | null;
        created_at: string | null;
        interior_pdf_path: string | null;
      }[]
    | null;

  try {
    profile = await getOrCreateUserProfile(userId);
    const supabase = createServerSupabaseClient();
    const [booksRes, ordersRes] = await Promise.all([
      supabase
        .from("books")
        .select("id, title, page_count, page_tier, updated_at, trim_size")
        .eq("user_id", userId)
        .eq("status", "draft")
        .order("updated_at", { ascending: false })
        .limit(10),
      supabase
        .from("orders")
        .select(
          "id, book_id, amount_total, status, created_at, interior_pdf_path",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);
    draftBooks = booksRes.data ?? null;
    orders = ordersRes.data ?? null;
  } catch (err) {
    const cause =
      err instanceof Error && "cause" in err ? (err as Error).cause : undefined;
    console.error("[Dashboard] Failed to load data:", err, cause ?? "");

    let message: string;
    const raw =
      err instanceof Error
        ? err.message
        : typeof (err as { message?: string })?.message === "string"
          ? (err as { message: string }).message
          : "";

    if (raw === "fetch failed" || raw.includes("fetch failed")) {
      message =
        "Could not reach the database. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env, and that Supabase is reachable.";
    } else if (raw) {
      message = raw;
    } else {
      message =
        "Failed to load dashboard. Check server logs and env (Supabase).";
    }

    throw new Error(`Dashboard: ${message}`);
  }

  const freeRemaining = profile.free_conversions_remaining ?? 0;
  const paidCredits = profile.paid_credits ?? 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Welcome to your dashboard!
        </h1>
        <p className="mt-1 text-muted-foreground">
          Create a coloring book from your photos, or convert a single photo and
          print it out.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm w-fit">
        <h2 className="font-heading text-sm font-semibold text-foreground">
          Conversion credits
        </h2>
        <p className="mt-2 text-2xl font-bold text-primary">
          {freeRemaining} free credits left
        </p>
        {paidCredits > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            Plus {paidCredits} paid credits
          </p>
        )}
        <Link
          href="/dashboard/buy-credits"
          className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
        >
          Buy Credits →
        </Link>
        <AddTestCreditsButton isDev={process.env.NODE_ENV === "development"} />
      </section>

      <div className="flex flex-wrap gap-4">
        <Link
          href="/dashboard/books/new"
          className="max-w-md h-fit block rounded-2xl border border-border bg-card p-6 font-heading text-lg font-semibold text-foreground shadow-sm hover:bg-primary/20 hover:border-primary"
        >
          <h2 className="font-heading text-lg font-bold text-foreground">
            Design a Coloring Book
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Create a new coloring book from your photos.
          </p>
          <video
            className="aspect-square w-full border-1 border-foreground rounded-lg p-2"
            src="/videos/birthday_book.mp4"
            playsInline
            muted
            loop
            autoPlay
            aria-label="Sample ColorDrop book"
          />
        </Link>
        <Link
          href="/dashboard/convert"
          className="max-w-md h-fit block rounded-2xl border border-border bg-card p-6 font-heading text-lg font-semibold text-foreground shadow-sm hover:bg-primary/20 hover:border-primary"
        >
          <h2 className="font-heading text-lg font-bold text-foreground">
            Convert a Single Photo & Print
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Convert a single photo and print it out.
          </p>
          <video
            className="aspect-square w-full border-1 border-foreground rounded-lg p-2"
            src="/videos/single_page.mp4"
            playsInline
            muted
            loop
            autoPlay
            aria-label="Sample ColorDrop book"
          />
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
          Saved books
        </h2>
        {draftBooks && draftBooks.length > 0 ? (
          <div className="mt-2 flex gap-4 overflow-x-auto pb-2">
            {draftBooks.map((b) => (
              <DraftBookCard
                key={b.id}
                id={b.id}
                title={b.title}
                page_count={b.page_count}
                page_tier={b.page_tier}
                trim_size={b.trim_size}
              />
            ))}
          </div>
        ) : (
          <div className="mt-2 rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center text-muted-foreground">
            No saved books. Create your first book above.
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
              <div
                key={o.id}
                className="flex min-w-[180px] flex-col rounded-xl border border-border bg-card p-4 shadow-sm hover:bg-muted/50"
              >
                <span className="text-sm font-medium text-foreground">
                  Order #{o.id.slice(0, 8)}
                </span>
                <span className="text-sm text-muted-foreground">
                  ${Math.round((o.amount_total ?? 0) / 100)} · {o.status}
                </span>
                <div className="mt-2 flex flex-col gap-1">
                  <Link
                    href={`/dashboard/orders/${o.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    View order →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-2 rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center text-muted-foreground">
            No orders yet.
          </div>
        )}
      </section>

      <DeleteAccountSection />
    </div>
  );
}
