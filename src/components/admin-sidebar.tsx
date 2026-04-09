"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEMS } from "@/lib/admin-nav";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin sections" className="flex flex-col gap-1">
      {ADMIN_NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md border px-3 py-2.5 text-sm transition-colors",
              "hover:bg-muted/50",
              active
                ? "border-primary/25 bg-primary/10 text-foreground"
                : "border-transparent text-muted-foreground",
            )}
          >
            <div className="flex items-center gap-2 font-medium">
              <Icon className="h-4 w-4" aria-hidden />
              {item.label}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
          </Link>
        );
      })}
    </nav>
  );
}
