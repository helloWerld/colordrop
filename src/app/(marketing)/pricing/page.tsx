import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="container min-h-screen px-4 py-16">
      <h1 className="font-heading text-3xl font-bold text-foreground">
        Pricing
      </h1>
      <p className="mt-4 text-muted-foreground">
        Conversion credits: 1 for $0.25, 50 for $10, 100 for $15. Books from
        ~$10 + shipping.
      </p>
      <Link href="/" className="mt-6 inline-block text-primary hover:underline">
        ← Home
      </Link>
    </div>
  );
}
