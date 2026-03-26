import { isStripeTestMode } from "@/lib/stripe";

export default function OrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const stripeTestMode = isStripeTestMode();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {stripeTestMode && (
        <div className="w-full bg-sky-500/15 border-b border-sky-500/30 px-4 py-2 text-center text-sm font-medium text-sky-900 dark:text-sky-100">
          Stripe test mode — no real charges.
        </div>
      )}
      {children}
    </div>
  );
}
