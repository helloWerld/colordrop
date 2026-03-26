"use client";

import { useClerk } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

type DashboardLogoutButtonProps = {
  label?: string;
  className?: string;
};

export function DashboardLogoutButton({
  label = "Log out",
  className,
}: DashboardLogoutButtonProps) {
  const { signOut } = useClerk();

  return (
    <button
      type="button"
      onClick={() => signOut({ redirectUrl: "/" })}
      className={cn(
        "flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      <LogOut className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </button>
  );
}
