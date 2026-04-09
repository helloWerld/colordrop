import Link from "next/link";
import { getPublicSupportEmail } from "@/lib/support-contact";

export function OrderSupportCallout() {
  const email = getPublicSupportEmail();

  return (
    <p className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
      Need help with this order?{" "}
      <a
        href={`mailto:${email}`}
        className="font-medium text-primary hover:underline"
      >
        {email}
      </a>{" "}
      (we aim to respond within 72 hours) ·{" "}
      <Link href="/faq" className="font-medium text-primary hover:underline">
        FAQ
      </Link>
      .
    </p>
  );
}
