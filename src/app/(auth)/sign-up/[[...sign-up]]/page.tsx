import { SignUp } from "@clerk/nextjs";
import { HeaderLogo } from "@/components/header-logo";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { marketingPageMetadata } from "@/lib/marketing-metadata";

export const metadata = marketingPageMetadata({
  title: "Create account",
  description:
    "Create a ColorDrop account to turn photos into coloring pages and order custom printed coloring books.",
  canonicalPath: "/sign-up",
});

export default function SignUpPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <Link
        href="/"
        className="flex flex-row items-center gap-2 absolute top-4 left-4"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Back to Home
      </Link>
      <div className="flex flex-col items-center justify-center w-full max-w-md">
        <HeaderLogo href="/sign-up" className="mb-4" />
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg rounded-2xl border border-border bg-background",
            },
          }}
          fallbackRedirectUrl="/dashboard"
          signInUrl="/sign-in"
        />
      </div>
    </div>
  );
}
