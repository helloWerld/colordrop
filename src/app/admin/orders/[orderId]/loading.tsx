function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-muted/60 ${className}`} />;
}

export default function AdminOrderDetailLoading() {
  return (
    <section
      className="space-y-6"
      role="status"
      aria-live="polite"
      aria-label="Loading order details"
    >
      <header className="space-y-2">
        <p className="text-xs text-muted-foreground">Loading order details...</p>
        <SkeletonBlock className="h-8 w-56" />
        <SkeletonBlock className="h-4 w-72 max-w-full" />
      </header>

      <div className="rounded-md border p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <SkeletonBlock className="h-20 w-full" />
          <SkeletonBlock className="h-20 w-full" />
        </div>
      </div>

      <div className="rounded-md border p-4 space-y-3">
        <SkeletonBlock className="h-6 w-40" />
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-4/5" />
      </div>

      <div className="rounded-md border p-4 space-y-3">
        <SkeletonBlock className="h-6 w-40" />
        <SkeletonBlock className="h-36 w-full" />
      </div>
    </section>
  );
}
