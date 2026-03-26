"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const SCROLL_THRESHOLD_PX = 400;

export function StickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > SCROLL_THRESHOLD_PX);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 px-4 py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] backdrop-blur supports-[backdrop-filter]:bg-background/80"
      role="banner"
      aria-label="Sign up for free conversions"
    >
      <div className="container mx-auto flex flex-wrap items-center justify-center gap-4 sm:justify-between">
        <p className="text-sm font-medium text-foreground">
          Try 3 FREE photo conversions, no card required!
        </p>
        <Link
          href="/sign-up"
          className="shrink-0 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try ColorDrop for FREE →
        </Link>
      </div>
    </div>
  );
}
