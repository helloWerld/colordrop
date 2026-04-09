"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { ADMIN_NAV_ITEMS } from "@/lib/admin-nav";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-md border border-border/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
        aria-expanded={open}
        aria-controls="admin-mobile-drawer"
        aria-label={open ? "Close admin menu" : "Open admin menu"}
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close admin menu overlay"
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside
            id="admin-mobile-drawer"
            className="fixed inset-y-0 left-0 z-50 w-[min(22rem,90vw)] border-r border-border/50 bg-background p-4 shadow-xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium">Admin sections</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                aria-label="Close admin menu"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <nav className="space-y-1" aria-label="Admin mobile sections">
              {ADMIN_NAV_ITEMS.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-md border px-3 py-2 text-sm",
                      active
                        ? "border-primary/25 bg-primary/10 text-foreground"
                        : "border-transparent text-muted-foreground hover:bg-muted/40",
                    )}
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <Icon className="h-4 w-4" aria-hidden />
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </>
      )}
    </div>
  );
}
