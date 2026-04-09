"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BookPlus,
  Coins,
  ImagePlus,
  LayoutDashboard,
  Menu,
  Save,
  X,
} from "lucide-react";
import { DashboardLogoutButton } from "@/components/dashboard-logout-button";
import { LuluDevPopover } from "@/components/lulu-dev-popover";
import { cn } from "@/lib/utils";

const linkClass =
  "flex items-center gap-2 text-muted-foreground hover:text-foreground py-2.5 text-sm border-b border-border/40 block w-full";

type DashboardHeaderNavProps = {
  showLuluDev: boolean;
  userEmail?: string | null;
};

export function DashboardHeaderNav({
  showLuluDev,
  userEmail,
}: DashboardHeaderNavProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelId = useId();
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    setMounted(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (open) firstLinkRef.current?.focus();
  }, [open]);

  const navLinkProps = { onClick: close };

  const menuLayer =
    mounted &&
    open &&
    createPortal(
      <>
        <button
          type="button"
          className="fixed inset-x-0 bottom-0 top-14 z-[100] bg-background/80 backdrop-blur-sm"
          aria-label="Close menu"
          onClick={close}
        />
        <div
          id={panelId}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className={cn(
            "fixed inset-y-0 right-0 z-[110] flex w-[min(100vw,20rem)] flex-col border-l border-border/40 bg-background shadow-lg",
            "animate-in slide-in-from-right duration-200",
          )}
        >
          <div className="flex h-14 items-center justify-end border-b border-border/40 px-3">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Close menu"
              onClick={close}
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <div className="border-b border-border/40 px-4 py-3">
            <p className="truncate text-sm text-muted-foreground">
              {userEmail ?? "No email available"}
            </p>
          </div>
          <nav
            className="flex flex-1 flex-col overflow-y-auto px-4 pb-6 pt-2"
            aria-label="Menu links"
          >
            <Link
              ref={firstLinkRef}
              href="/dashboard"
              className={linkClass}
              {...navLinkProps}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/dashboard/books/new"
              className={linkClass}
              {...navLinkProps}
            >
              <BookPlus className="w-4 h-4" />
              New Coloring Book
            </Link>
            <Link
              href="/dashboard/convert"
              className={linkClass}
              {...navLinkProps}
            >
              <ImagePlus className="w-4 h-4" />
              Convert a Single Image
            </Link>
            <Link
              href="/dashboard/saved-pages"
              className={linkClass}
              {...navLinkProps}
            >
              <Save className="w-4 h-4" />
              My Saved Images
            </Link>
            <Link
              href="/dashboard/buy-credits"
              className={linkClass}
              {...navLinkProps}
            >
              <Coins className="w-4 h-4" />
              Buy Credits
            </Link>
            <div className="mt-4 pt-4">
              <DashboardLogoutButton
                label="Logout"
                className="w-full justify-start px-0 py-2.5 text-sm hover:text-destructive"
              />
            </div>
          </nav>
        </div>
      </>,
      document.body,
    );

  return (
    <div className="relative flex flex-wrap items-center justify-end gap-2 sm:gap-4 text-sm">
      {menuLayer}
      <nav
        className="flex flex-wrap items-center gap-2 sm:gap-4"
        aria-label="Dashboard"
      >
        <Link
          href="/dashboard"
          className="flex flex-row items-center gap-2 hover:bg-primary hover:text-background px-3 py-2 rounded-lg text-muted-foreground  shrink-0 transition-colors duration-200"
        >
          Dashboard
        </Link>
      </nav>
      <div className="relative z-50 flex items-center gap-2 sm:gap-4 shrink-0">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <X className="h-5 w-5" aria-hidden />
          ) : (
            <Menu className="h-5 w-5" aria-hidden />
          )}
        </button>
        {showLuluDev && (
          <span className="pl-1 sm:pl-2">
            <LuluDevPopover />
          </span>
        )}
      </div>
    </div>
  );
}
