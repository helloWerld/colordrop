import type { Metadata } from "next";

/** Per-route SEO fields; inherits metadataBase and default OG image from root layout. */
export function marketingPageMetadata(opts: {
  title: string;
  description: string;
  canonicalPath: string;
}): Metadata {
  const { title, description, canonicalPath } = opts;
  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
