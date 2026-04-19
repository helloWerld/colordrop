import { redirect } from "next/navigation";
import { getAdminAllowlistMatchEmail } from "@/lib/admin-auth";
import { HeaderLogo } from "@/components/header-logo";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminMobileNav } from "@/components/admin-mobile-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminEmail = await getAdminAllowlistMatchEmail();
  if (!adminEmail) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen w-full bg-background">
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[1200px] items-center justify-between px-4">
          <HeaderLogo href="/admin" size="sm" />
          <div className="flex items-center gap-3">
            <p className="hidden text-sm text-muted-foreground lg:block">
              Internal Admin Dashboard
            </p>
            <AdminMobileNav />
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-lg border border-border/50 bg-background/50 p-3">
            <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Admin sections
            </p>
            <AdminSidebar />
          </div>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
