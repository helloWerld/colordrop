import Link from "next/link";

export function OrderSupportCallout() {
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();

  return (
    <p className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
      Need help with this order?{" "}
      {email ? (
        <a href={`mailto:${email}`} className="font-medium text-primary hover:underline">
          Contact support
        </a>
      ) : (
        <Link href="/faq" className="font-medium text-primary hover:underline">
          Visit our FAQ
        </Link>
      )}
      .
    </p>
  );
}
