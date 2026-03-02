import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between px-4">
          <Link href="/dashboard" className="font-heading text-lg font-bold text-primary">
            ColorDrop
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/dashboard/convert" className="text-muted-foreground hover:text-foreground">
              Convert an Image
            </Link>
            <Link href="/dashboard/saved-pages" className="text-muted-foreground hover:text-foreground">
              My Saved Pages
            </Link>
            <Link href="/dashboard/buy-credits" className="text-muted-foreground hover:text-foreground">
              Buy Credits
            </Link>
          </nav>
        </div>
      </header>
      <main className="container px-4 py-8">{children}</main>
    </div>
  );
}
