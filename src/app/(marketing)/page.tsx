import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { HeaderLogo } from "@/components/header-logo";
import { HeaderDripAnimation } from "@/components/header-drip-animation";
import { Diff } from "@/components/diff";
import { StickyCta } from "@/components/sticky-cta";
import {
  Upload,
  WandSparkles,
  BookOpen,
  Package,
  Printer,
  Gift,
  Truck,
  Download,
  Shield,
  Lock,
  Sparkles,
  Award,
  ChevronDown,
  Star,
} from "lucide-react";
import { WordRotate } from "@/components/ui/word-rotate";
import { Highlighter } from "@/components/ui/highlighter";
import { marketingPageMetadata } from "@/lib/marketing-metadata";
import { getSiteUrl } from "@/lib/site-url";

export const metadata = marketingPageMetadata({
  title: "Color Your Photos",
  description:
    "Turn your favorite photos into custom, printed coloring books. Upload photos, our AI converts them to coloring pages, then print at home or order a book we print and ship.",
  canonicalPath: "/",
});

const SAMPLE_GALLERY = [
  {
    before: "/gallery/sample-1-before.jpg",
    after: "/gallery/sample-1-after.png",
    beforeLabel: "Photo",
    afterLabel: "Coloring Book",
    alt: "Family Photos",
  },
  {
    before: "/gallery/sample-2-before.jpg",
    after: "/gallery/sample-2-after.png",
    beforeLabel: "Photo",
    afterLabel: "Coloring Book",
    alt: "Holiday Photos",
  },
  {
    before: "/gallery/sample-3-before.png",
    after: "/gallery/sample-3-after.png",
    beforeLabel: "Photo",
    afterLabel: "Coloring Book",
    alt: "Birthday Photos",
  },
  {
    before: "/gallery/sample-4-before.jpg",
    after: "/gallery/sample-4-after.jpg",
    beforeLabel: "Photo",
    afterLabel: "Coloring Book",
    alt: "Graduation Photos",
  },
  {
    before: "/gallery/sample-5-before.jpg",
    after: "/gallery/sample-5-after.jpg",
    beforeLabel: "Photo",
    afterLabel: "Coloring Book",
    alt: "Wedding Photos",
  },
  {
    before: "/gallery/sample-6-before.jpg",
    after: "/gallery/sample-6-after.jpg",
    beforeLabel: "Photo",
    afterLabel: "Coloring Book",
    alt: "Vacation Photos",
  },
] as const;

export default async function LandingPage() {
  const { userId } = await auth();
  const isSignedIn = Boolean(userId);
  const siteUrl = getSiteUrl().replace(/\/$/, "");
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "ColorDrop",
        url: siteUrl,
      },
      {
        "@type": "WebSite",
        name: "ColorDrop",
        url: siteUrl,
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-background w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="relative flex flex-col w-full shrink-0">
        <header className="border-b border-border/40 bg-background z-[10]">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <HeaderLogo href="/" />
            <nav className="flex items-center gap-4">
              {isSignedIn ? (
                <Link
                  href="/dashboard"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/sign-up"
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Get Started →
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <HeaderDripAnimation />
      </div>

      <main className="flex flex-col flex-1 mx-auto w-full max-w-7xl items-center justify-center -mt-24 pb-20">
        <section className="px-4 py-28 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-heading text-4xl font-bold  text-foreground/90 md:text-5xl lg:text-6xl text-balance">
              Turn Your{" "}
              <WordRotate
                duration={2000}
                className="inline"
                words={[
                  "Family",
                  "Pet",
                  "Vacation",
                  "Wedding",
                  "Holiday",
                  "Birthday",
                ]}
              />{" "}
              Photos Into{" "}
              <Highlighter
                strokeWidth={5}
                action="highlight"
                color="#ffde00"
                animationDuration={2000}
                padding={0}
              >
                Coloring Books
              </Highlighter>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Upload photos. AI makes the outlines. We print your coloring book.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Printed books ship to the <strong>United States</strong> and{" "}
              <strong>Canada</strong> only. Conversion credits are for AI
              conversions only—book printing and shipping are always a separate
              charge at checkout.
            </p>
            <Link
              href="/sign-up"
              className="mt-8 inline-block rounded-lg bg-primary px-8 py-4 text-lg font-medium text-primary-foreground shadow-lg hover:bg-primary/90"
            >
              Get Started — It&apos;s Easy!
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              3 free conversions for new accounts — no card required
            </p>
          </div>
        </section>

        <section className="w-full border-t border-border/40 py-8">
          <div className="container px-4">
            <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Shield
                  className="h-5 w-5 shrink-0 text-foreground/70"
                  aria-hidden
                />
                Secure payment
              </span>
              <span className="flex items-center gap-2">
                <Lock
                  className="h-5 w-5 shrink-0 text-foreground/70"
                  aria-hidden
                />
                Your photos stay private
              </span>
              <span className="flex items-center gap-2">
                <Sparkles
                  className="h-5 w-5 shrink-0 text-foreground/70"
                  aria-hidden
                />
                3 free conversions to start
              </span>
              <span className="flex items-center gap-2">
                <Award
                  className="h-5 w-5 shrink-0 text-foreground/70"
                  aria-hidden
                />
                Quality print & ship
              </span>
            </div>
          </div>
        </section>

        <section className="w-full flex flex-col items-center justify-center border-t border-border/40 bg-muted/30 py-16">
          <div className="container flex flex-col items-center justify-center px-4">
            <h2 className="font-heading text-center text-2xl font-bold text-foreground md:text-3xl">
              How It Works
            </h2>
            <div className="mx-auto mt-12 items-center justify-center grid max-w-7xl gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 text-center shadow-sm aspect-square max-w-64">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/60 text-black text-2xl">
                  <Upload />
                </div>
                <h3 className="font-heading font-semibold text-foreground">
                  Upload
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add your favorite photos — kids, pets, vacations, or anything
                  you love.
                </p>
              </div>
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 text-center shadow-sm aspect-square max-w-64">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/60 text-black text-2xl">
                  <WandSparkles />
                </div>
                <h3 className="font-heading font-semibold text-foreground">
                  AI Magic
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Our AI turns each photo into a clean, kid-friendly coloring
                  page outline.
                </p>
              </div>
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 text-center shadow-sm aspect-square max-w-64">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary/60 text-black text-2xl">
                  <BookOpen />
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

        <section className="flex flex-col items-center justify-center py-16">
          <div className="container px-4 text-center">
            <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
              Before and After
            </h2>
            <p className="mt-2 text-muted-foreground">
              Drag the handle to compare.
            </p>
            <div className="mx-auto w-full gap-8 mt-8 grid items-center justify-center max-w-7xl grid-cols-1 md:grid-cols-2 xl:grid-cols-3 h-full ">
              {SAMPLE_GALLERY.map((sample, i) => (
                <Diff
                  key={i}
                  beforeSrc={sample.before}
                  afterSrc={sample.after}
                  beforeLabel={sample.beforeLabel}
                  afterLabel={sample.afterLabel}
                  beforeAlt={`${sample.alt} before`}
                  afterAlt={`${sample.alt} after`}
                  imageLoading={i === 0 ? "eager" : "lazy"}
                />
              ))}
            </div>
          </div>
          <Link
            href="/sign-up"
            className="mt-12 inline-block rounded-lg bg-primary px-8 py-4 text-lg font-medium text-primary-foreground shadow-lg hover:bg-primary/90 "
          >
            Try it Now 👉 Convert Your First 3 Photos for FREE!
          </Link>
        </section>

        <section className="w-full border-t border-border/40 bg-muted/30 py-16">
          <div className="container px-4">
            <h2 className="font-heading text-center text-2xl font-bold text-foreground md:text-3xl">
              2 Ways to Use ColorDrop
            </h2>
            <p className="mt-2 text-center text-muted-foreground max-w-2xl mx-auto">
              Order a keepsake book we ship to you, or convert and print pages
              yourself.
            </p>
            <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Truck className="h-4 w-4" aria-hidden />
                We print & ship (US &amp; Canada)
              </span>
              <span className="flex items-center gap-2">
                <Download className="h-4 w-4" aria-hidden />
                You print at home
              </span>
            </div>

            <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2">
              <div className="relative flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
                <span className="absolute right-4 top-4 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  Most popular
                </span>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#23A4EF]/50">
                  <Package className="h-7 w-7" />
                </div>
                <h3 className="font-heading text-xl font-bold text-foreground">
                  Custom printed book
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Upload your images, convert them to coloring pages, and build
                  a custom book. We print and ship it directly to your door.
                </p>
                <p className="mt-3 text-sm font-medium text-foreground">
                  Book at your door in ~1 week
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Best for: gifts, keepsakes, grandparents
                </p>
                <Link
                  href="/dashboard/books/new"
                  className="mt-6 inline-block w-fit rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Create your first book →
                </Link>
                <p className="mt-2 text-xs text-muted-foreground">
                  Free to sign up — 3 conversions on us
                </p>
              </div>
              <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FFDE00]/50">
                  <Printer className="h-7 w-7" />
                </div>
                <h3 className="font-heading text-xl font-bold text-foreground">
                  Convert & print yourself
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Upload one image at a time, convert it to a coloring page,
                  then download and print whenever you like.
                </p>
                <p className="mt-3 text-sm font-medium text-foreground">
                  Download in seconds, print anytime
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Best for: quick prints, classroom, one-off pages
                </p>
                <Link
                  href="/dashboard/convert"
                  className="mt-6 inline-block w-fit rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Convert & print immediately →
                </Link>
                <p className="mt-2 text-xs text-muted-foreground">
                  Free to sign up — 3 conversions on us
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border/40 py-16">
          <div className="container px-4">
            <h2 className="font-heading text-center text-2xl font-bold text-foreground md:text-3xl">
              Loved by Parents and Families
            </h2>
            <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-8 gap-y-6 rounded-2xl border border-border bg-muted/30 px-8 py-8 md:gap-12 md:px-12">
              <div className="text-center">
                <p className="font-heading text-3xl font-bold text-foreground md:text-4xl">
                  10k+
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Coloring Books Created
                </p>
              </div>
              <div className="text-center">
                <p className="font-heading text-3xl font-bold text-foreground md:text-4xl">
                  5k+
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Happy Customers
                </p>
              </div>
              <div className="text-center">
                <p className="font-heading text-3xl font-bold text-foreground md:text-4xl">
                  4.9★
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Average rating
                </p>
              </div>
            </div>
            <div className="mx-auto mt-12 grid max-w-5xl gap-8 md:grid-cols-2">
              <blockquote className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-3 flex gap-0.5 text-accent" aria-hidden>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground">
                  &ldquo;Made a book of our vacation photos for the kids. They
                  actually fight over who gets to color which page. Worth every
                  penny.&rdquo;
                </p>
                <footer className="mt-4 text-sm font-medium text-foreground">
                  — Sarah, mom of two
                </footer>
              </blockquote>
              <blockquote className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-3 flex gap-0.5 text-accent" aria-hidden>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground">
                  &ldquo;Sent my grandkids a coloring book of our family
                  reunion. Their mom said they couldn&apos;t believe it was
                  really them in the pictures. So special.&rdquo;
                </p>
                <footer className="mt-4 text-sm font-medium text-foreground">
                  — Mike, grandfather
                </footer>
              </blockquote>
              <blockquote className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-3 flex gap-0.5 text-accent" aria-hidden>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground">
                  &ldquo;I use it for quick printables for my class. Field trip
                  photos turned into coloring pages in minutes. The kids love
                  seeing themselves.&rdquo;
                </p>
                <footer className="mt-4 text-sm font-medium text-foreground">
                  — Jen, elementary teacher
                </footer>
              </blockquote>
              <blockquote className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-3 flex gap-0.5 text-accent" aria-hidden>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground">
                  &ldquo;Did one for my sister&apos;s baby shower, photos of the
                  family. Everyone cried. Best gift I&apos;ve ever given.&rdquo;
                </p>
                <footer className="mt-4 text-sm font-medium text-foreground">
                  — Amanda, first-time aunt
                </footer>
              </blockquote>
            </div>
          </div>
        </section>

        <section className="border-t border-border/40 w-full">
          <div className="grid w-full grid-cols-1 md:grid-cols-2">
            {/* Left: video square */}
            <div className="relative w-full aspect-square min-h-0 bg-muted rounded-2xl overflow-clip">
              <video
                className="absolute inset-0 h-full w-full object-cover"
                src="/videos/sample-book-video.mp4"
                playsInline
                muted
                loop
                autoPlay
                aria-label="Sample ColorDrop book"
              />
            </div>
            {/* Right: text content */}
            <div className="flex w-full flex-col justify-center px-6 py-8 text-center md:aspect-square md:px-10 md:py-12 md:text-left lg:px-16">
              <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl flex flex-wrap items-center justify-center gap-2 md:justify-start">
                <Gift className="h-7 w-7 shrink-0 text-primary" aria-hidden />
                The Perfect Custom Gift
              </h2>
              <p className="mt-4 text-muted-foreground">
                ColorDrop turns your favorite photos into one-of-a-kind coloring
                books; meaningful, personal, and fun for any age. Great for
                kids, families, and anyone who loves a unique keepsake.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2 md:justify-start">
                {[
                  "Birthday",
                  "Weddings",
                  "Holidays",
                  "Baby shower",
                  "Graduation",
                  "Anniversary",
                  "Hannukah",
                  "Family reunions",
                  "Special events",
                  "Just for kids",
                  "Teacher gifts",
                  "Grandparents",
                  "Christmas",
                ].map((occasion) => (
                  <span
                    key={occasion}
                    className="rounded-full border border-border bg-muted/50 px-4 py-1 text-xs font-medium text-foreground"
                  >
                    {occasion}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex justify-center md:justify-start">
                <Link
                  href="/sign-up"
                  className="inline-block rounded-lg bg-primary px-8 py-4 text-lg font-medium text-primary-foreground shadow-lg hover:bg-primary/90"
                >
                  Create a custom gift →
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border/40 bg-muted/30 py-16 w-full">
          <div className="container px-4">
            <h2 className="font-heading text-center text-2xl font-bold text-foreground md:text-3xl">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-2 text-center text-muted-foreground">
              One credit = one photo turned into a coloring page. New accounts
              get 3 free credits, no card required.
            </p>
            <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
                <p className="bg-accent/80 rounded-full px-4 py-1 w-fit mx-auto text-sm font-medium  text-black/70">
                  Try it
                </p>
                <p className="mt-2 font-heading text-2xl font-bold text-foreground">
                  1 credit
                </p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  $0.99 each
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  $0.99 per conversion
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
                <p className="bg-primary/70 rounded-full px-4 py-1 w-fit mx-auto text-sm font-medium text-black/70">
                  Most popular
                </p>
                <p className="mt-2 font-heading text-2xl font-bold text-foreground">
                  50 credits
                </p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  $24.99
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  $0.50 per conversion · Save 50%
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
                <p className="bg-secondary/60 rounded-full px-4 py-1 w-fit mx-auto text-sm font-medium text-black/70">
                  Best value
                </p>
                <p className="mt-2 font-heading text-2xl font-bold text-foreground">
                  100 credits
                </p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  $39.99
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  $0.40 per conversion · Save 60%
                </p>
              </div>
            </div>
            <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-border bg-card p-6 text-center">
              <p className="font-heading font-semibold text-foreground">
                Printed books
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Books are priced separately: printing and shipping only. Credits
                are for converting photos to coloring pages only and cannot be
                applied to the price of a printed book.
              </p>
            </div>
            <p className="mt-6 text-center">
              <Link
                href="/pricing"
                className="inline-block text-primary font-medium hover:underline"
              >
                Full pricing details →
              </Link>
            </p>
          </div>
        </section>

        <section
          className="border-t border-border/40 py-16"
          aria-labelledby="faq-heading"
        >
          <div className="container px-4">
            <h2
              id="faq-heading"
              className="font-heading text-center text-2xl font-bold text-foreground md:text-3xl"
            >
              Frequently Asked Questions
            </h2>
            <div className="mx-auto mt-12 max-w-2xl space-y-2">
              <details className="group rounded-xl border border-border bg-card [&_summary]:list-none ">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-5 py-4 font-medium text-foreground [&::-webkit-details-marker]:hidden">
                  How many photos can I put in a book?
                  <ChevronDown
                    className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180 text-muted-foreground"
                    aria-hidden
                  />
                </summary>
                <p className="border-t border-border px-5 py-4 text-sm text-muted-foreground">
                  You need at least 2 pages plus a cover to create a book. You
                  can add as many pages as you like—each conversion uses one
                  credit, and you can also add pages from your saved conversions
                  at no extra credit cost.
                </p>
              </details>
              <details className="group rounded-xl border border-border bg-card [&_summary]:list-none">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-5 py-4 font-medium text-foreground [&::-webkit-details-marker]:hidden">
                  Can I use the same photo in a book and print it at home too?
                  <ChevronDown
                    className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180 text-muted-foreground"
                    aria-hidden
                  />
                </summary>
                <p className="border-t border-border px-5 py-4 text-sm text-muted-foreground">
                  Yes. Every conversion is saved to your library. You can add a
                  page to a book, and you can also download or print it anytime
                  from the convert flow. One conversion, multiple uses.
                </p>
              </details>
              <details className="group rounded-xl border border-border bg-card [&_summary]:list-none">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-5 py-4 font-medium text-foreground [&::-webkit-details-marker]:hidden">
                  How long does shipping take?
                  <ChevronDown
                    className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180 text-muted-foreground"
                    aria-hidden
                  />
                </summary>
                <p className="border-t border-border px-5 py-4 text-sm text-muted-foreground">
                  We print and ship on demand. Most orders are at your door
                  within about a week, depending on your location. You&apos;ll
                  get tracking once your book ships.
                </p>
              </details>
              <details className="group rounded-xl border border-border bg-card [&_summary]:list-none">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-5 py-4 font-medium text-foreground [&::-webkit-details-marker]:hidden">
                  What if I don&apos;t like the outline?
                  <ChevronDown
                    className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180 text-muted-foreground"
                    aria-hidden
                  />
                </summary>
                <p className="border-t border-border px-5 py-4 text-sm text-muted-foreground">
                  You can remove any page you don&apos;t like and upload a
                  replacement. Use another credit for the new conversion. Our AI
                  works best with clear, well-lit photos of people, pets, or
                  scenes.
                </p>
              </details>
              <details className="group rounded-xl border border-border bg-card [&_summary]:list-none">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-5 py-4 font-medium text-foreground [&::-webkit-details-marker]:hidden">
                  How do the 3 free conversions work?
                  <ChevronDown
                    className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180 text-muted-foreground"
                    aria-hidden
                  />
                </summary>
                <p className="border-t border-border px-5 py-4 text-sm text-muted-foreground">
                  New accounts get 3 free conversion credits—no card required.
                  Use them to try the convert flow or to build pages for your
                  first book. After that, you can buy more credits in small or
                  larger packs.
                </p>
              </details>
            </div>
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
              <a
                href="mailto:hello@colordrop.ai"
                className="text-muted-foreground hover:text-foreground"
              >
                Support
              </a>
            </nav>
          </div>
        </footer>
      </main>
      <StickyCta />
    </div>
  );
}
