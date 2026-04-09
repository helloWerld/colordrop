function SkeletonLine({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-muted/60 ${className}`} />;
}

export default function AdminUserDetailLoading() {
  return (
    <section
      className="space-y-6"
      role="status"
      aria-live="polite"
      aria-label="Loading user details"
    >
      <header className="space-y-2">
        <p className="text-xs text-muted-foreground">Loading user details...</p>
        <SkeletonLine className="h-8 w-56" />
        <div className="rounded-md border p-3 space-y-2">
          <SkeletonLine className="h-4 w-3/5" />
          <SkeletonLine className="h-4 w-1/2" />
          <SkeletonLine className="h-4 w-1/3" />
        </div>
      </header>

      <section className="space-y-2">
        <SkeletonLine className="h-7 w-28" />
        <div className="rounded-md border p-3 space-y-2">
          <SkeletonLine className="h-4 w-full" />
          <SkeletonLine className="h-4 w-full" />
          <SkeletonLine className="h-4 w-5/6" />
        </div>
      </section>

      <section className="space-y-2">
        <SkeletonLine className="h-7 w-28" />
        <div className="rounded-md border p-3 space-y-2">
          <SkeletonLine className="h-4 w-full" />
          <SkeletonLine className="h-4 w-5/6" />
          <SkeletonLine className="h-4 w-2/3" />
        </div>
      </section>
    </section>
  );
}
