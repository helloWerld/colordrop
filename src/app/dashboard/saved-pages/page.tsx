"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Conversion = {
  id: string;
  outline_image_path: string;
  conversion_context: string;
  stylization: string;
  created_at: string;
};

export default function SavedPagesPage() {
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(true);
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/conversions");
      if (res.ok) {
        const data = await res.json();
        setConversions(data.conversions ?? []);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    conversions.forEach((c) => {
      if (urls[c.id]) return;
      fetch(
        `/api/signed-url?bucket=outlines&path=${encodeURIComponent(c.outline_image_path)}`
      )
        .then((r) => r.json())
        .then((d) => d.url && setUrls((prev) => ({ ...prev, [c.id]: d.url })))
        .catch(() => {});
    });
  }, [conversions, urls]);

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this saved page?")) return;
    const res = await fetch(`/api/conversions/${id}`, { method: "DELETE" });
    if (res.ok) setConversions((prev) => prev.filter((x) => x.id !== id));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard" className="text-sm text-primary hover:underline">
          ← Back to Dashboard
        </Link>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold text-foreground">
          My Saved Pages
        </h1>
        <p className="mt-1 text-muted-foreground">
          Use these in a book (no extra credit) or download.
        </p>
      </div>

      {conversions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center text-muted-foreground">
          No saved pages yet. Convert an image or add pages to a book to see
          them here.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {conversions.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
            >
              <div className="aspect-square bg-muted/30">
                {urls[c.id] ? (
                  <img
                    src={urls[c.id]}
                    alt="Coloring page"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    Loading…
                  </div>
                )}
              </div>
              <div className="p-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString()}
                </span>
                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/books/new?add=${c.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Add to Book
                  </Link>
                  {urls[c.id] && (
                    <a
                      href={urls[c.id]}
                      download="coloring-page.png"
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Download
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    className="text-sm text-destructive hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
