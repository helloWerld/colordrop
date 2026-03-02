import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <span className="font-heading text-xl font-bold text-primary">
            ColorDrop
          </span>
          <nav className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Get Started — It&apos;s Easy!
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-7xl">
        <section className="px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Turn Your Photos Into Coloring Books
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Upload photos. AI makes the outlines. We print your coloring book.
            </p>
            <Link
              href="/sign-up"
              className="mt-8 inline-block rounded-full bg-primary px-8 py-4 text-lg font-medium text-primary-foreground shadow-lg hover:bg-primary/90"
            >
              Get Started — It&apos;s Easy!
            </Link>
          </div>
        </section>

        <section className="border-t border-border/40 bg-muted/30 py-16">
          <div className="container px-4">
            <h2 className="font-heading text-center text-2xl font-bold text-foreground md:text-3xl">
              How It Works
            </h2>
            <div className="mx-auto mt-12 grid max-w-4xl gap-8 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-2xl">
                  1
                </div>
                <h3 className="font-heading font-semibold text-foreground">
                  Upload
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add your favorite photos — kids, pets, vacations, or anything
                  you love.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary/20 text-2xl">
                  2
                </div>
                <h3 className="font-heading font-semibold text-foreground">
                  AI Magic
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Our AI turns each photo into a clean, kid-friendly coloring
                  page outline.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/30 text-2xl">
                  3
                </div>
                <h3 className="font-heading font-semibold text-foreground">
                  Book Arrives
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  We print and ship a real, physical coloring book to your door.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container px-4 text-center">
            <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
              Sample Gallery
            </h2>
            <p className="mt-2 text-muted-foreground">
              Before and after examples — placeholder for launch.
            </p>
            <div className="mx-auto mt-8 flex max-w-2xl justify-center gap-4 rounded-2xl border border-dashed border-border bg-muted/20 p-12">
              <span className="text-muted-foreground">
                Photo → Coloring page
              </span>
            </div>
          </div>
        </section>

        <section className="border-t border-border/40 bg-muted/30 py-16">
          <div className="container px-4 text-center">
            <h2 className="font-heading text-2xl font-bold text-foreground">
              Pricing
            </h2>
            <p className="mt-2 text-muted-foreground">
              Starting at $0.25 per conversion. Books from ~$10.
            </p>
            <Link
              href="/pricing"
              className="mt-4 inline-block text-primary font-medium hover:underline"
            >
              Learn more →
            </Link>
          </div>
        </section>

        <footer className="border-t border-border/40 py-8">
          <div className="container flex flex-col items-center justify-between gap-4 px-4 md:flex-row">
            <span className="text-sm text-muted-foreground">
              © ColorDrop. Color Your Photos.
            </span>
            <nav className="flex gap-6 text-sm">
              <Link
                href="/faq"
                className="text-muted-foreground hover:text-foreground"
              >
                FAQ
              </Link>
              <Link
                href="/terms"
                className="text-muted-foreground hover:text-foreground"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="text-muted-foreground hover:text-foreground"
              >
                Privacy
              </Link>
              <Link
                href="/cookies"
                className="text-muted-foreground hover:text-foreground"
              >
                Cookies
              </Link>
            </nav>
          </div>
        </footer>
      </main>
    </div>
  );
}
