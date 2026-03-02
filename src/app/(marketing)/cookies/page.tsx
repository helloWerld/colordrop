import Link from "next/link";

export default function CookiesPage() {
  return (
    <div className="container min-h-screen max-w-3xl px-4 py-16">
      <h1 className="font-heading text-3xl font-bold text-foreground">
        Cookie Policy
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: March 2026</p>

      <div className="prose prose-neutral mt-8 space-y-6 text-foreground">
        <section>
          <h2 className="font-heading text-lg font-semibold">What we use cookies for</h2>
          <p>
            ColorDrop uses cookies to provide and secure the service:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Session and authentication (Clerk)</strong> — So you can sign in and stay signed in. These are essential for the app to work.
            </li>
            <li>
              <strong>Analytics (if enabled)</strong> — We may use Vercel Analytics or similar to understand how the site is used (e.g. page views). This helps us improve the product.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold">Your choices</h2>
          <p>
            You can disable non-essential cookies via your browser settings. Blocking session cookies will prevent you from signing in.
          </p>
        </section>
      </div>

      <Link href="/" className="mt-10 inline-block text-primary hover:underline">
        ← Home
      </Link>
    </div>
  );
}
