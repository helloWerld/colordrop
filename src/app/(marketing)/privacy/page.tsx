import Link from "next/link";
import { marketingPageMetadata } from "@/lib/marketing-metadata";

export const metadata = marketingPageMetadata({
  title: "Privacy Policy",
  description:
    "How ColorDrop collects, uses, and protects your data: accounts, uploads, orders, payments, cookies, and your rights.",
  canonicalPath: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="container min-h-screen max-w-3xl px-4 py-16">
      <h1 className="font-heading text-3xl font-bold text-foreground">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: April 2026</p>

      <div className="prose prose-neutral mt-8 space-y-6 text-foreground">
        <section>
          <h2 className="font-heading text-lg font-semibold">1. Data we collect</h2>
          <p>
            We collect: (1) Account and profile data (email, name, profile picture) via our authentication provider (Clerk). (2) Images you upload (photos and generated coloring pages), stored in our database and file storage (Supabase). (3) Order and shipping information (name, address, phone) when you place an order. (4) Payment information is processed by Stripe; we do not store full card numbers.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold">2. How we use your data</h2>
          <p>
            We use your data to provide the service: creating and storing your books, converting images (via Gemini and OpenAI), processing payments (Stripe), and fulfilling orders (printing and shipping via Lulu). We send transactional emails (order confirmation, shipping notification) via Resend.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold">3. Sharing</h2>
          <p>
            We share data only as needed: (1) <strong>Lulu</strong> — shipping address and contact info to print and ship your book. (2) <strong>Stripe</strong> — payment and billing data for processing. (3) <strong>Google Gemini / OpenAI</strong> — images for AI conversion (processed according to their policies). (4) <strong>Clerk</strong> — for authentication. (5) <strong>Supabase</strong> — for database and file storage. (6) <strong>Resend</strong> — email address for transactional emails (order confirmation, shipping notifications). We do not sell your personal data.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold">4. Retention</h2>
          <p>
            We retain your account and order data while your account is active. Uploaded original images may be deleted 180 days after order fulfillment or after you delete a book. Order and transaction records are retained indefinitely as required for legal and accounting purposes. Our service is available in the United States and Canada only.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold">5. Your rights and account deletion</h2>
          <p>
            You can request account deletion from your account settings or by contacting us at{" "}
            <a className="text-primary underline" href="mailto:hello@colordrop.ai">
              hello@colordrop.ai
            </a>
            . We aim to respond within 72 hours. We will delete or anonymize your profile, saved conversions, books, and order metadata. We may retain minimal data where required by law (e.g. financial records).
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold">6. Cookies</h2>
          <p>
            We use cookies for session management (Clerk) and analytics (if enabled). See our Cookie Policy for details.
          </p>
        </section>
      </div>

      <Link href="/" className="mt-10 inline-block text-primary hover:underline">
        ← Home
      </Link>
    </div>
  );
}
