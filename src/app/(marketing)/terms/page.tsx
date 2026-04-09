import Link from "next/link";
import { marketingPageMetadata } from "@/lib/marketing-metadata";

export const metadata = marketingPageMetadata({
  title: "Terms of Service",
  description:
    "ColorDrop Terms of Service: using our photo-to-coloring-book service, custom print-on-demand books, payments, and policies.",
  canonicalPath: "/terms",
});

export default function TermsPage() {
  return (
    <div className="container min-h-screen max-w-3xl px-4 py-16">
      <h1 className="font-heading text-3xl font-bold text-foreground">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: April 2026
      </p>

      <div className="prose prose-neutral mt-8 space-y-6 text-foreground">
        <section>
          <h2 className="font-heading text-lg font-semibold">1. Agreement</h2>
          <p>
            By using ColorDrop (“we,” “us,” “our”) you agree to these Terms of
            Service. If you do not agree, do not use our service.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold">
            2. Refund policy
          </h2>
          <p>
            Coloring books are custom, print-on-demand products.{" "}
            <strong>All sales are final.</strong> We do not offer refunds or
            cancellations once payment is processed.
          </p>
          <p>
            If we are unable to print or fulfill your order after payment due to
            a technical or operational failure on our side (for example, after
            reasonable attempts to submit your book to print), we will
            automatically refund the charge to your original payment method.
            This automatic refund applies only to inability to print or fulfill
            your order — not to discretionary refunds, change of mind, or
            buyer&apos;s remorse.
          </p>
          <p>
            For manufacturing defects (for example, misprinted pages or binding
            defects on a book you received), shipping loss, or transit damage,
            we review the issue <strong>case by case</strong> through support.
            Contact us at{" "}
            <a
              className="text-primary underline"
              href="mailto:hello@colordrop.ai"
            >
              hello@colordrop.ai
            </a>
            . This is separate from the automatic refund described above, which
            applies only when we cannot complete printing or fulfillment after
            payment due to a technical or operational failure on our side.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold">
            3. Acceptable use
          </h2>
          <p>
            You may not use ColorDrop to upload content that is illegal,
            infringing, defamatory, or that you do not have the right to use.
            You must not upload inappropriate content. We may suspend or
            terminate access for violations.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold">
            4. Intellectual property and takedowns
          </h2>
          <p>
            You represent and warrant that you own or have the necessary rights
            to use all images you upload. You are responsible for any claims
            that your content infringes third-party rights. We do not claim
            ownership of your images but require a license to process, store,
            and use them to fulfill your orders and provide the service.
          </p>
          <p>
            We do not pre-screen all uploads. If we receive a valid copyright
            or other rights complaint (including notices consistent with the
            DMCA process where applicable), we may remove or disable access to
            the relevant content and take other appropriate action. Contact:{" "}
            <a
              className="text-primary underline"
              href="mailto:hello@colordrop.ai"
            >
              hello@colordrop.ai
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold">
            5. Eligibility and geographic availability
          </h2>
          <p>
            You must be at least 13 years old (or the minimum age required
            in your jurisdiction) to use ColorDrop. By using the service you
            represent that you meet this requirement.
          </p>
          <p>
            ColorDrop currently ships printed books to addresses in the{" "}
            <strong>United States and Canada</strong> only. We do not
            guarantee availability outside these regions.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold">
            6. Service availability
          </h2>
          <p>
            We provide the service “as is.” We do not guarantee uninterrupted
            access and are not liable for delays or failures due to third-party
            services (e.g. printing, shipping, payment processors).
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold">7. Contact</h2>
          <p>
            Support:{" "}
            <a
              className="text-primary underline"
              href="mailto:hello@colordrop.ai"
            >
              hello@colordrop.ai
            </a>
            . We aim to respond within 72 hours.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold">8. Changes</h2>
          <p>
            We may update these terms. Continued use after changes constitutes
            acceptance. Material changes will be communicated via the app or
            email where appropriate.
          </p>
        </section>
      </div>

      <Link
        href="/"
        className="mt-10 inline-block text-primary hover:underline"
      >
        ← Home
      </Link>
    </div>
  );
}
