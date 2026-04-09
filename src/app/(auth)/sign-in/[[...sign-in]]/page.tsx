import { SignIn } from "@clerk/nextjs";
import { HeaderLogo } from "@/components/header-logo";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { marketingPageMetadata } from "@/lib/marketing-metadata";

export const metadata = marketingPageMetadata({
  title: "Sign in",
  description:
    "Sign in to ColorDrop to create coloring books from your photos, manage orders, and access your library.",
  canonicalPath: "/sign-in",
});

export default function SignInPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <Link
        href="/"
        className="flex flex-row items-center gap-2 absolute top-4 left-4"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Back to Home
      </Link>
      <div className="flex flex-col items-center justify-center w-full max-w-md">
        <HeaderLogo href="/sign-in" className="mb-4" />
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg rounded-2xl border border-border",
            },
          }}
          fallbackRedirectUrl="/dashboard"
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  );
}
