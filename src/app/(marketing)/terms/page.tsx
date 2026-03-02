import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="container min-h-screen max-w-3xl px-4 py-16">
      <h1 className="font-heading text-3xl font-bold text-foreground">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: March 2026</p>

      <div className="prose prose-neutral mt-8 space-y-6 text-foreground">
        <section>
          <h2 className="font-heading text-lg font-semibold">1. Agreement</h2>
          <p>
            By using ColorDrop (“we,” “us,” “our”) you agree to these Terms of Service. If you do not agree, do not use our service.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold">2. Refund policy</h2>
          <p>
            Coloring books are custom, print-on-demand products. <strong>All sales are final.</strong> We do not offer refunds or cancellations once payment is processed.
          </p>
          <p>
            Exceptions: (1) Printing defects (misprinted pages, binding issues) — we will arrange a replacement at no cost. (2) Book never arrives (lost in transit) — we will handle replacement or refund on a case-by-case basis. Contact us at the support email provided in the app.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold">3. Acceptable use</h2>
          <p>
            You may not use ColorDrop to upload content that is illegal, infringing, defamatory, or that you do not have the right to use. You must not upload inappropriate content. We may suspend or terminate access for violations.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold">4. Intellectual property</h2>
          <p>
            You represent and warrant that you own or have the necessary rights to use all images you upload. You are responsible for any claims that your content infringes third-party rights. We do not claim ownership of your images but require a license to process, store, and use them to fulfill your orders and provide the service.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold">5. Service availability</h2>
          <p>
            We provide the service “as is.” We do not guarantee uninterrupted access and are not liable for delays or failures due to third-party services (e.g. printing, shipping, payment processors).
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold">6. Changes</h2>
          <p>
            We may update these terms. Continued use after changes constitutes acceptance. Material changes will be communicated via the app or email where appropriate.
          </p>
        </section>
      </div>

      <Link href="/" className="mt-10 inline-block text-primary hover:underline">
        ← Home
      </Link>
    </div>
  );
}
