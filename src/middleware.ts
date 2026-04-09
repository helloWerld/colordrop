import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sitemap.xml",
  "/robots.txt",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/pricing",
  "/faq",
  "/terms",
  "/privacy",
  "/cookies",
  "/api/webhooks/(.*)",
  "/api/cron/(.*)",
  "/api/dev/(.*)",
]);

function isClerkConfigured(): boolean {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  return key.length > 0 && key.startsWith("pk_") && !key.includes("placeholder");
}

const clerkMiddlewareWithAuth = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (!isClerkConfigured()) {
    return NextResponse.next();
  }
  return clerkMiddlewareWithAuth(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|mp4|webm|mov)).*)",
    "/(api|trpc)(.*)",
  ],
};
