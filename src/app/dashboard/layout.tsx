import { DashboardHeaderNav } from "@/components/dashboard-header-nav";
import { currentUser } from "@clerk/nextjs/server";
import { HeaderLogo } from "@/components/header-logo";
import { getAdminAllowlistMatchForClerkUser } from "@/lib/admin-auth";
import { isLuluSandbox } from "@/lib/lulu";
import { isStripeTestMode } from "@/lib/stripe";

const isDev = process.env.NODE_ENV === "development";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  const userEmail =
    user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;
  const showAdminNav = getAdminAllowlistMatchForClerkUser(user) !== null;
  const luluSandbox = isLuluSandbox();
  const stripeTestMode = isStripeTestMode();
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="flex w-full items-center justify-between border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="flex w-full h-14 items-center justify-between px-4">
          <HeaderLogo href="/dashboard" size="sm" />
          <DashboardHeaderNav
            showLuluDev={isDev}
            userEmail={userEmail}
            showAdminNav={showAdminNav}
          />
        </div>
      </header>
      {stripeTestMode && (
        <div className="w-full bg-sky-500/15 border-b border-sky-500/30 px-4 py-2 text-center text-sm font-medium text-sky-900 dark:text-sky-100">
          Stripe test mode — no real charges. Use test cards; for local webhooks
          run{" "}
          <code className="rounded bg-sky-500/20 px-1 text-xs">
            stripe listen --forward-to localhost:3000/api/webhooks/stripe
          </code>{" "}
          and set the webhook signing secret for your active mode (
          <code className="rounded bg-sky-500/20 px-1 text-xs">
            STRIPE_SANDBOX_WEBHOOK_SECRET
          </code>{" "}
          when{" "}
          <code className="rounded bg-sky-500/20 px-1 text-xs">
            STRIPE_USE_SANDBOX=true
          </code>
          , otherwise{" "}
          <code className="rounded bg-sky-500/20 px-1 text-xs">
            STRIPE_WEBHOOK_SECRET
          </code>
          ) to the CLI <code className="rounded bg-sky-500/20 px-1 text-xs">whsec_</code>{" "}
          value.
        </div>
      )}
      {luluSandbox && (
        <div className="w-full bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-center text-sm font-medium text-amber-800 dark:text-amber-200">
          Lulu sandbox mode — book orders are for testing only and will not be
          printed or shipped.
        </div>
      )}
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8">
        {children}
      </main>
    </div>
  );
}
