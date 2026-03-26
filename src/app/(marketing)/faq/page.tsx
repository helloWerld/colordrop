import Link from "next/link";

const qas = [
  {
    q: "How does ColorDrop work?",
    a: "Upload your photos, choose a style, and our AI turns them into black-and-white coloring pages. You can print them at home, download them, or add them to a custom coloring book we print and ship to you.",
  },
  {
    q: "Do I need to pay for conversions?",
    a: "New users get 3 free image conversions. After that, you can buy more credits (including discounted packs), which all go into a single paid credits balance. Credits are only used for conversions and cannot be applied toward book purchases; books are paid separately (printing/binding + shipping).",
  },
  {
    q: "Can I get a refund?",
    a: "Coloring books are custom and print-on-demand, so all sales are final. We do not offer refunds or cancellations once payment is processed. Exceptions: if your book has a printing defect (e.g. misprinted pages or binding issues), we will arrange a replacement. If your book never arrives (lost in transit), contact us and we will handle it case by case.",
  },
  {
    q: "How long until my book arrives?",
    a: "Standard shipping is typically 7–14 business days; Priority 5–7 days; Expedited 2–3 days. You will receive a tracking email when your book ships.",
  },
  {
    q: "What image formats can I upload?",
    a: "We accept JPEG, PNG, and WebP. Max 20 MB per image; minimum 800×800 pixels for best results.",
  },
  {
    q: "Who owns the images I upload?",
    a: "You do. You must have the right to use the images you upload. We only use them to provide the service (conversion, printing, and delivery).",
  },
];

export default function FAQPage() {
  return (
    <div className="container min-h-screen max-w-3xl px-4 py-16">
      <h1 className="font-heading text-3xl font-bold text-foreground">FAQ</h1>
      <p className="mt-2 text-muted-foreground">
        Common questions about ColorDrop.
      </p>

      <dl className="mt-10 space-y-8">
        {qas.map(({ q, a }) => (
          <div key={q}>
            <dt className="font-heading font-semibold text-foreground">{q}</dt>
            <dd className="mt-2 text-muted-foreground">{a}</dd>
          </div>
        ))}
      </dl>

      <Link href="/" className="mt-10 inline-block text-primary hover:underline">
        ← Home
      </Link>
    </div>
  );
}
