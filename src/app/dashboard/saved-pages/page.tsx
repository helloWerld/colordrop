"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/loading-spinner";

type Conversion = {
  id: string;
  outline_image_path: string;
  conversion_context: string;
  collection_id?: string;
  created_at: string;
};

type Collection = { id: string; name: string; created_at: string };

export default function SavedPagesPage() {
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [filterCollectionId, setFilterCollectionId] = useState<string | null>(
    null,
  );
  const [newCollectionName, setNewCollectionName] = useState("");
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [loading, setLoading] = useState(true);
  const [urls, setUrls] = useState<Record<string, string>>({});

  const loadConversions = async () => {
    const url = filterCollectionId
      ? `/api/conversions?collection_id=${encodeURIComponent(filterCollectionId)}`
      : "/api/conversions";
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setConversions(data.conversions ?? []);
    }
  };

  const loadCollections = async () => {
    const res = await fetch("/api/collections");
    if (res.ok) {
      const data = await res.json();
      setCollections(data.collections ?? []);
    }
  };

  useEffect(() => {
    (async () => {
      await Promise.all([loadConversions(), loadCollections()]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (loading) return;
    loadConversions();
  }, [filterCollectionId]);

  useEffect(() => {
    conversions.forEach((c) => {
      if (urls[c.id]) return;
      fetch(
        `/api/signed-url?bucket=outlines&path=${encodeURIComponent(c.outline_image_path)}`,
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

  const handleCollectionChange = async (
    conversionId: string,
    collectionId: string | null,
  ) => {
    const res = await fetch(`/api/conversions/${conversionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collection_id: collectionId }),
    });
    if (res.ok) {
      setConversions((prev) => {
        const next = prev.map((c) =>
          c.id === conversionId
            ? { ...c, collection_id: collectionId ?? undefined }
            : c,
        );
        if (filterCollectionId && collectionId !== filterCollectionId) {
          return next.filter((c) => c.id !== conversionId);
        }
        return next;
      });
    }
  };

  const handleCreateCollection = async () => {
    const name = newCollectionName.trim();
    if (!name) return;
    setCreatingCollection(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const data = await res.json();
        setCollections((prev) => [data.collection, ...prev]);
        setNewCollectionName("");
      }
    } finally {
      setCreatingCollection(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard"
          className="text-sm text-primary hover:underline"
        >
          ← Back to Dashboard
        </Link>
        <div className="text-muted-foreground">
          <LoadingSpinner size="sm" label="Loading saved pages" />
        </div>
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
          Use these in a book (no extra credit) or download. Organize with
          collections.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <h2 className="font-heading font-semibold text-foreground">
          Collections
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterCollectionId(null)}
            className={`rounded-lg px-3 py-1.5 text-sm ${filterCollectionId === null ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            All
          </button>
          {collections.map((coll) => (
            <button
              key={coll.id}
              type="button"
              onClick={() => setFilterCollectionId(coll.id)}
              className={`rounded-lg px-3 py-1.5 text-sm ${filterCollectionId === coll.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {coll.name}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            placeholder="New collection name"
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm w-48"
          />
          <button
            type="button"
            onClick={handleCreateCollection}
            disabled={creatingCollection || !newCollectionName.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {creatingCollection ? "Creating…" : "Create"}
          </button>
        </div>
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
              <div className="p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString()}
                    {collections.find((x) => x.id === c.collection_id) && (
                      <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs">
                        {
                          collections.find((x) => x.id === c.collection_id)
                            ?.name
                        }
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={c.collection_id ?? ""}
                    onChange={(e) =>
                      handleCollectionChange(c.id, e.target.value || null)
                    }
                    className="rounded border border-input bg-background px-2 py-1 text-xs"
                  >
                    <option value="">No collection</option>
                    {collections.map((coll) => (
                      <option key={coll.id} value={coll.id}>
                        {coll.name}
                      </option>
                    ))}
                  </select>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
