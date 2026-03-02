"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type Page = { id: string; position: number; outline_image_path: string; conversion_status: string; outline_url?: string | null };
type Cover = { id: string; image_path: string; cover_url?: string | null } | null;
type Book = { id: string; page_count: number; credits_applied_value_cents: number };

export function BookEditorClient({
  bookId,
  initialBook,
  initialPages,
  initialCover,
}: {
  bookId: string;
  initialBook: Book;
  initialPages: Page[];
  initialCover: Cover;
}) {
  const [pages, setPages] = useState(initialPages);
  const [cover, setCover] = useState(initialCover);
  const [stylization, setStylization] = useState("none");
  const [uploading, setUploading] = useState(false);
  const [addFromSavedOpen, setAddFromSavedOpen] = useState(false);
  const [savedList, setSavedList] = useState<{ id: string; outline_image_path: string }[]>([]);
  const [removePageId, setRemovePageId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [creditsAppliedCents, setCreditsAppliedCents] = useState(
    initialBook.credits_applied_value_cents ?? 0
  );
  const [estimatedTotalCents, setEstimatedTotalCents] = useState<number | null>(null);

  const fetchPrice = useCallback(async () => {
    const res = await fetch(`/api/books/${bookId}/price?shipping_level=MAIL`);
    if (res.ok) {
      const data = await res.json();
      setEstimatedTotalCents(data.totalCents ?? null);
    }
  }, [bookId]);

  useEffect(() => {
    fetchPrice();
  }, [fetchPrice]);

  const loadSaved = async () => {
    const res = await fetch("/api/conversions");
    if (res.ok) {
      const data = await res.json();
      setSavedList(data.conversions ?? []);
    }
  };

  const addPageFromSaved = async (savedId: string) => {
    const res = await fetch(`/api/books/${bookId}/pages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ saved_conversion_id: savedId }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      alert(errData.error ?? "Failed to add page");
      return;
    }
    const data = await res.json();
    setPages((prev) => [...prev, { ...data.page, conversion_status: "completed", outline_url: data.page?.outline_url ?? null }]);
    setAddFromSavedOpen(false);
    fetchPrice();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;
    const files = Array.from(fileList);
    const maxNew = Math.max(0, 50 - pages.length);
    if (files.length > maxNew) {
      alert(`Book has maximum 50 pages. You can add ${maxNew} more.`);
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}));
          throw new Error(errData.error ?? "Upload failed");
        }
        const { path } = await uploadRes.json();
        const convertRes = await fetch("/api/pages/convert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storage_path: path,
            stylization,
            conversion_context: "book",
            book_id: bookId,
          }),
        });
        if (convertRes.status === 402) {
          alert("No credits left. Buy more credits.");
          break;
        }
        if (!convertRes.ok) {
          const errData = await convertRes.json().catch(() => ({}));
          throw new Error(errData.error ?? "Conversion failed");
        }
      }
      const bookRes = await fetch(`/api/books/${bookId}`);
      const bookData = await bookRes.json();
      setPages(bookData.pages ?? []);
      if (bookData.credits_applied_value_cents !== undefined)
        setCreditsAppliedCents(bookData.credits_applied_value_cents);
      fetchPrice();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("book_id", bookId);
    const res = await fetch("/api/upload/cover", {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      const bookRes = await fetch(`/api/books/${bookId}`);
      if (bookRes.ok) {
        const bookData = await bookRes.json();
        if (bookData.cover) setCover(bookData.cover);
      } else {
        setCover({ id: "temp", image_path: "" });
      }
    }
    e.target.value = "";
  };

  const canPreview = pages.length >= 2 && cover;
  const creditsCents = creditsAppliedCents;

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const from = draggedIndex ?? parseInt(e.dataTransfer.getData("text/plain"), 10);
    setDraggedIndex(null);
    if (from === dropIndex || isNaN(from)) return;
    const reordered = [...pages];
    const [removed] = reordered.splice(from, 1);
    reordered.splice(dropIndex, 0, removed);
    setPages(reordered);
    const res = await fetch(`/api/books/${bookId}/pages/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageIds: reordered.map((p) => p.id) }),
    });
    if (!res.ok) {
      const bookRes = await fetch(`/api/books/${bookId}`);
      const bookData = await bookRes.json();
      setPages(bookData.pages ?? reordered);
    }
  };
  const handleDragEnd = () => setDraggedIndex(null);

  const handleRemovePage = async (pageId: string) => {
    setRemoving(true);
    try {
      const res = await fetch(`/api/books/${bookId}/pages/${pageId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to remove page");
      }
      setPages((prev) => prev.filter((p) => p.id !== pageId));
      const bookRes = await fetch(`/api/books/${bookId}`);
      if (bookRes.ok) {
        const bookData = await bookRes.json();
        if (bookData.credits_applied_value_cents !== undefined)
          setCreditsAppliedCents(bookData.credits_applied_value_cents);
      }
      fetchPrice();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove page");
    } finally {
      setRemoving(false);
      setRemovePageId(null);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-heading font-semibold text-foreground">Add pages</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload new photos (uses 1 credit each) or add from My Saved Pages (no
          credit).
        </p>
        <select
          value={stylization}
          onChange={(e) => setStylization(e.target.value)}
          className="mt-4 rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="none">No stylization</option>
          <option value="fairy_tale">Fairy tale</option>
          <option value="cartoon">Cartoon</option>
          <option value="storybook">Storybook</option>
          <option value="sketch">Sketch</option>
        </select>
        <div className="mt-4 flex flex-wrap gap-4">
          <label className="cursor-pointer rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {uploading ? "Uploading…" : "Upload photo(s)"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={uploading}
              multiple
              onChange={handleFileUpload}
            />
          </label>
          <button
            type="button"
            onClick={() => {
              setAddFromSavedOpen(true);
              loadSaved();
            }}
            className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/50"
          >
            Add from Saved Pages
          </button>
        </div>
      </div>

      {addFromSavedOpen && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-heading font-semibold">Choose a saved page</h3>
          <div className="mt-4 grid grid-cols-4 gap-4">
            {savedList.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => addPageFromSaved(c.id)}
                className="aspect-square rounded-lg border border-border bg-muted/20 hover:bg-muted/50"
              >
                Add
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setAddFromSavedOpen(false)}
            className="mt-4 text-sm text-muted-foreground hover:underline"
          >
            Close
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-heading font-semibold text-foreground">
          Pages ({pages.length})
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Drag to reorder.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {pages.map((p, i) => (
            <div
              key={p.id}
              draggable
              onDragStart={(e) => handleDragStart(e, i)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
              className={`aspect-square cursor-grab rounded-lg border border-border bg-muted/20 overflow-hidden relative active:cursor-grabbing group ${draggedIndex === i ? "opacity-50" : ""}`}
            >
              {p.outline_url ? (
                <img
                  src={p.outline_url}
                  alt={`Page ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              ) : null}
              <span className="absolute left-2 top-2 z-10 rounded bg-black/60 px-2 py-1 text-xs text-white">
                {i + 1}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setRemovePageId(p.id);
                }}
                className="absolute right-2 top-2 z-10 rounded bg-black/60 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {removePageId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-lg max-w-sm">
            <p className="font-medium text-foreground">Remove this page?</p>
            <p className="mt-2 text-sm text-muted-foreground">
              The page will stay in My Saved Pages. You can add it back anytime.
            </p>
            <div className="mt-6 flex gap-3 justify-end">
              <button
                type="button"
                disabled={removing}
                onClick={() => setRemovePageId(null)}
                className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted/50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={removing}
                onClick={() => handleRemovePage(removePageId)}
                className="rounded-full bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {removing ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-heading font-semibold text-foreground">Cover</h2>
        {cover ? (
          <div className="mt-2">
            {"cover_url" in cover && cover.cover_url ? (
              <img
                src={cover.cover_url}
                alt="Cover"
                className="aspect-square max-h-48 w-auto rounded-lg border border-border object-cover"
              />
            ) : (
              <p className="text-sm text-muted-foreground">Cover added.</p>
            )}
          </div>
        ) : (
          <label className="mt-2 block cursor-pointer text-sm text-primary hover:underline">
            Upload cover image
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleCoverUpload}
            />
          </label>
        )}
      </div>

      <div className="sticky bottom-0 flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-lg">
        <div>
          <p className="font-medium text-foreground">
            {pages.length} pages
            {creditsCents > 0 && (
              <span className="ml-2 text-sm text-muted-foreground">
                (${(creditsCents / 100).toFixed(2)} credit value at checkout)
              </span>
            )}
          </p>
          {estimatedTotalCents !== null && (
            <p className="mt-1 text-sm text-muted-foreground">
              Est. total: ${(estimatedTotalCents / 100).toFixed(2)} (Standard shipping)
            </p>
          )}
        </div>
        {canPreview ? (
          <Link
            href={`/dashboard/books/${bookId}/preview`}
            className="rounded-full bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90"
          >
            Preview My Book
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">
            Add at least 2 pages and a cover to preview.
          </span>
        )}
      </div>
    </>
  );
}
