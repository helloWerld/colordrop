function SkeletonBar({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-muted/60 ${className}`} />;
}

export default function AdminLoading() {
  return (
    <section
      className="space-y-4"
      role="status"
      aria-live="polite"
      aria-label="Loading admin page"
    >
      <header className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Loading admin page...</p>
        <SkeletonBar className="h-8 w-64" />
        <SkeletonBar className="h-4 w-[28rem] max-w-full" />
      </header>

      <div className="rounded-md border p-4">
        <div className="space-y-3">
          <SkeletonBar className="h-5 w-full" />
          <SkeletonBar className="h-5 w-full" />
          <SkeletonBar className="h-5 w-4/5" />
          <SkeletonBar className="h-5 w-3/5" />
        </div>
      </div>

      <div className="rounded-md border p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <SkeletonBar className="h-24 w-full" />
          <SkeletonBar className="h-24 w-full" />
        </div>
      </div>
    </section>
  );
}
