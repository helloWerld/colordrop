/** Canonical marketing / app origin for sitemaps, metadataBase, and JSON-LD. */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
