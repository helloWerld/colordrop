import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import { Nunito, Inter } from "next/font/google";
import { clerkThemeVariables } from "@/lib/clerk-theme";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "ColorDrop — Color Your Photos",
    template: "%s | ColorDrop",
  },
  description:
    "Turn your favorite photos into custom, printed coloring books. Upload photos, AI converts them to coloring pages, we print and ship.",
  openGraph: {
    title: "ColorDrop — Color Your Photos",
    description:
      "Turn your favorite photos into custom, printed coloring books.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ColorDrop — Color Your Photos",
    description:
      "Turn your favorite photos into custom, printed coloring books.",
  },
};

const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const isClerkConfigured =
  clerkPubKey.length > 0 &&
  clerkPubKey.startsWith("pk_") &&
  !clerkPubKey.includes("placeholder");

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const bodyContent = isClerkConfigured ? (
    <ClerkProvider
      publishableKey={clerkPubKey}
      appearance={{ variables: clerkThemeVariables }}
    >
      {children}
    </ClerkProvider>
  ) : (
    children
  );

  return (
    <html lang="en" className={`${nunito.variable} ${inter.variable}`}>
      <body className="min-h-screen w-full font-sans antialiased bg-background text-foreground">
        {bodyContent}
        <Analytics />
      </body>
    </html>
  );
}
