import { DashboardHeaderNav } from "@/components/dashboard-header-nav";
import { HeaderLogo } from "@/components/header-logo";
import { isLuluSandbox } from "@/lib/lulu";
import { isStripeTestMode } from "@/lib/stripe";

const isDev = process.env.NODE_ENV === "development";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const luluSandbox = isLuluSandbox();
  const stripeTestMode = isStripeTestMode();
  return (
    <div className="flex flex-col items-center justify-start w-full min-h-screen bg-background max-w-7xl mx-auto">
      <header className="flex w-full items-center justify-between border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="flex w-full h-14 items-center justify-between px-4">
          <HeaderLogo href="/dashboard" size="sm" />
          <DashboardHeaderNav showLuluDev={isDev} />
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
      <main className="flex flex-col w-full items-center min-h-screen justify-center px-4 py-8">
        {children}
      </main>
    </div>
  );
}
