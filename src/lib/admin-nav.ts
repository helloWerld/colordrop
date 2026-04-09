import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ChartNoAxesColumn,
  FileSearch,
  FolderOpen,
  ReceiptText,
  Users,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    href: "/admin/users",
    label: "Users",
    description: "Profiles, support metadata, credit balances",
    icon: Users,
  },
  {
    href: "/admin/orders",
    label: "Orders",
    description: "Statuses, Stripe/Lulu IDs, shipping, and errors",
    icon: ReceiptText,
  },
  {
    href: "/admin/economics",
    label: "Economics",
    description: "Lulu costs vs charged customer prices",
    icon: ChartNoAxesColumn,
  },
  {
    href: "/admin/conversions",
    label: "Conversions",
    description: "Provider usage, failures, and conversion telemetry",
    icon: FileSearch,
  },
  {
    href: "/admin/content",
    label: "Content",
    description: "Customer uploads and generated outlines",
    icon: FolderOpen,
  },
  {
    href: "/admin/api-health",
    label: "API Health",
    description: "Endpoint health checks and status overview",
    icon: Activity,
  },
  {
    href: "/admin/logs",
    label: "Logs",
    description: "Searchable Stripe and Lulu integration events",
    icon: FileSearch,
  },
];
