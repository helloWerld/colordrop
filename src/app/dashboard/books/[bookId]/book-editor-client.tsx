"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { getProductByTrimCode } from "@/lib/book-products";
import {
  Crop,
  Eye,
  Image,
  Info,
  Pencil,
  Save,
  Trash,
  Upload,
} from "lucide-react";
import { CoverPrintPreview } from "@/components/cover-print-preview";
import { PageTrimUniformPreview } from "@/components/page-trim-uniform-preview";
import { CropRotateEditor } from "@/components/crop-rotate-editor";
import { Highlighter } from "@/components/ui/highlighter";
import { UploadConsentCheckbox } from "@/components/upload-consent-checkbox";

type Credits = {
  free_remaining: number;
  paid_credits: number;
};

type Page = {
  id: string;
  position: number;
  outline_image_path: string;
  conversion_status: string;
  outline_url?: string | null;
  crop_rect?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  } | null;
  rotation_degrees?: number | null;
};
type Cover = {
  id: string;
  image_path: string;
  crop_rect?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  } | null;
  rotation_degrees?: number | null;
  cover_url?: string | null;
} | null;
type Book = {
  id: string;
  page_count: number;
  title?: string | null;
  page_tier?: number | null;
  trim_size?: string | null;
};

type ConversionStep = "uploading" | "processing" | "preparing";

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
  const [bookTitle, setBookTitle] = useState(initialBook.title?.trim() ?? "");
  const [credits, setCredits] = useState<Credits | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [convertError, setConvertError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionStep, setConversionStep] = useState<ConversionStep | null>(
    null,
  );
  const preparingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [addFromUploadOpen, setAddFromUploadOpen] = useState(false);
  const [addFromSavedOpen, setAddFromSavedOpen] = useState(false);
  const [savedList, setSavedList] = useState<
    { id: string; outline_image_path: string }[]
  >([]);
  const [savedPageUrls, setSavedPageUrls] = useState<Record<string, string>>(
    {},
  );
  const [addingSavedId, setAddingSavedId] = useState<string | null>(null);
  const [removePageId, setRemovePageId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [estimatedTotalCents, setEstimatedTotalCents] = useState<number | null>(
    null,
  );
  const [priceError, setPriceError] = useState<string | null>(null);
  const [editPageId, setEditPageId] = useState<string | null>(null);
  const [cropCoverOpen, setCropCoverOpen] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);
  const [coverUploadMessage, setCoverUploadMessage] = useState<string | null>(
    null,
  );
  const [, setSavingEdit] = useState(false);
  const [uploadConsentPage, setUploadConsentPage] = useState(false);
  const [coverUploadConsent, setCoverUploadConsent] = useState(false);

  const fetchCredits = useCallback(async () => {
    const res = await fetch("/api/credits");
    if (res.ok) {
      const data = await res.json();
      setCredits(data);
    }
  }, []);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (preparingTimeoutRef.current)
        clearTimeout(preparingTimeoutRef.current);
    };
  }, [previewUrl]);

  const clearPreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setPreviewFile(null);
    setConvertError(null);
    setUploadConsentPage(false);
  }, [previewUrl]);

  const fetchPrice = useCallback(async () => {
    setPriceError(null);
    const res = await fetch(`/api/books/${bookId}/price?shipping_level=MAIL`);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setEstimatedTotalCents(data.totalCents ?? null);
    } else {
      setEstimatedTotalCents(null);
      setPriceError(
        data.error ??
          "Pricing is temporarily unavailable. Try reloading the page or contact support.",
      );
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

  useEffect(() => {
    if (!addFromSavedOpen || savedList.length === 0) return;
    savedList.forEach((c) => {
      if (savedPageUrls[c.id]) return;
      fetch(
        `/api/signed-url?bucket=outlines&path=${encodeURIComponent(c.outline_image_path)}`,
      )
        .then((r) => r.json())
        .then(
          (d) =>
            d.url && setSavedPageUrls((prev) => ({ ...prev, [c.id]: d.url })),
        )
        .catch(() => {});
    });
  }, [addFromSavedOpen, savedList, savedPageUrls]);

  const addPageFromSaved = async (savedId: string) => {
    setAddingSavedId(savedId);
    try {
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
      setPages((prev) => [
        ...prev,
        {
          ...data.page,
          conversion_status: "completed",
          outline_url: data.page?.outline_url ?? null,
        },
      ]);
      setAddFromSavedOpen(false);
      fetchPrice();
    } finally {
      setAddingSavedId(null);
    }
  };

  const pageTier = initialBook.page_tier ?? 24;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;
    const file = fileList[0];
    if (pages.length >= pageTier) {
      alert(
        `This book has a maximum of ${pageTier} pages. Remove a page to add another.`,
      );
      e.target.value = "";
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setConvertError(null);
    setUploadConsentPage(false);
    e.target.value = "";
  };

  const totalCredits =
    credits != null ? credits.free_remaining + credits.paid_credits : 0;

  const handleStartConvert = async () => {
    if (!previewFile || isConverting || totalCredits === 0) return;
    if (!uploadConsentPage) {
      setConvertError(
        "Please confirm the upload agreement before converting.",
      );
      return;
    }
    if (pages.length >= pageTier) return;

    setIsConverting(true);
    setConversionStep("uploading");
    setConvertError(null);

    if (preparingTimeoutRef.current) {
      clearTimeout(preparingTimeoutRef.current);
      preparingTimeoutRef.current = null;
    }

    try {
      const formData = new FormData();
      formData.append("file", previewFile);
      formData.append("upload_consent", "true");
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}));
        throw new Error(errData.error ?? "Upload failed");
      }
      const { path } = await uploadRes.json();

      setConversionStep("processing");
      preparingTimeoutRef.current = setTimeout(() => {
        setConversionStep("preparing");
        preparingTimeoutRef.current = null;
      }, 2500);

      const convertRes = await fetch("/api/pages/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storage_path: path,
          conversion_context: "book",
          book_id: bookId,
          upload_consent: true,
        }),
      });

      if (preparingTimeoutRef.current) {
        clearTimeout(preparingTimeoutRef.current);
        preparingTimeoutRef.current = null;
      }

      if (convertRes.status === 402) {
        alert("No credits left. Buy more credits.");
        fetchCredits();
        clearPreview();
        setIsConverting(false);
        setConversionStep(null);
        return;
      }
      if (!convertRes.ok) {
        const errData = await convertRes.json().catch(() => ({}));
        setConvertError(errData.error ?? "Conversion failed");
        return;
      }

      const bookRes = await fetch(`/api/books/${bookId}`);
      const bookData = await bookRes.json();
      setPages(bookData.pages ?? []);
      if (bookData.cover) setCover(bookData.cover);
      fetchPrice();
      fetchCredits();
      clearPreview();
    } catch (err) {
      console.error(err);
      setConvertError(
        err instanceof Error ? err.message : "Something went wrong",
      );
    } finally {
      setIsConverting(false);
      setConversionStep(null);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!coverUploadConsent) {
      setCoverUploadError(
        "Please confirm the upload agreement before uploading a cover image.",
      );
      e.target.value = "";
      return;
    }

    setIsUploadingCover(true);
    setCoverUploadError(null);
    setCoverUploadMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("book_id", bookId);
      formData.append("upload_consent", "true");
      const res = await fetch("/api/upload/cover", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let message = "Failed to upload cover image. Please try again.";
        try {
          const data = await res.json();
          if (data?.error && typeof data.error === "string") {
            message = data.error;
          }
        } catch {}
        setCoverUploadError(message);
        return;
      }

      const bookRes = await fetch(`/api/books/${bookId}`);
      if (bookRes.ok) {
        const bookData = await bookRes.json();
        if (bookData.cover) {
          setCover(bookData.cover);
          setCoverUploadMessage(
            "Cover uploaded. You can crop & rotate it now.",
          );
        } else {
          setCoverUploadError(
            "Cover uploaded but failed to refresh. Try reloading the page.",
          );
        }
      } else {
        setCoverUploadError(
          "Cover uploaded but failed to refresh. Try reloading the page.",
        );
      }
    } catch (err) {
      console.error(err);
      setCoverUploadError(
        "Something went wrong while uploading the cover. Please try again.",
      );
    } finally {
      setIsUploadingCover(false);
      e.target.value = "";
    }
  };

  const canPreview =
    pages.length >= 2 &&
    pages.length === pageTier &&
    cover &&
    bookTitle.trim().length > 0;

  const highlightedSteps = useMemo(() => {
    const h = new Set<1 | 2 | 3 | 4 | 5>();
    if (!bookTitle.trim()) {
      h.add(1);
      return h;
    }
    if (!cover) {
      h.add(2);
      return h;
    }
    if (pages.length === 0) {
      h.add(3);
      return h;
    }
    if (pages.length < pageTier) {
      h.add(3);
      h.add(4);
      return h;
    }
    h.add(5);
    return h;
  }, [bookTitle, cover, pages.length, pageTier]);

  const stepTitle = (step: 1 | 2 | 3 | 4 | 5, label: string) =>
    highlightedSteps.has(step) ? (
      <Highlighter
        key={step}
        action="highlight"
        color="#ffde00"
        strokeWidth={2}
      >
        {label}
      </Highlighter>
    ) : (
      label
    );

  const saveTitle = useCallback(async () => {
    const trimmed = bookTitle.trim();
    if (!trimmed) return;
    await fetch(`/api/books/${bookId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed }),
    });
  }, [bookId, bookTitle]);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const from =
      draggedIndex ?? parseInt(e.dataTransfer.getData("text/plain"), 10);
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
      const res = await fetch(`/api/books/${bookId}/pages/${pageId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to remove page");
      }
      setPages((prev) => prev.filter((p) => p.id !== pageId));
      fetchPrice();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove page");
    } finally {
      setRemoving(false);
      setRemovePageId(null);
    }
  };

  const product = initialBook.trim_size
    ? getProductByTrimCode(initialBook.trim_size)
    : null;

  return (
    <>
      {product && (
        <div className="rounded-2xl border border-amber-300 bg-amber-100 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/30">
          <p className="font-medium text-md text-foreground flex flex-row gap-2 items-center">
            <Info className="h-4 w-4" /> For best print quality
          </p>
          <p className="mt-1 text-muted-foreground">
            Use images at least{" "}
            <span className="font-semibold underline">
              {product.recommendedMinWidthPx} × {product.recommendedMinHeightPx}
            </span>{" "}
            px for this book size. <br />
            Images that are too small or the wrong aspect may be stretched or
            cropped and can result in misprints.
          </p>
        </div>
      )}
      <h3 className="text-xl font-heading font-bold text-foreground">
        {stepTitle(1, "Step 1: Name your book")}
      </h3>
      <div className="rounded-2xl border border-border bg-card p-6 w-fit max-w-3xl">
        <label
          htmlFor="book-name"
          className="block font-medium text-foreground"
        >
          Book name
        </label>
        <input
          id="book-name"
          type="text"
          value={bookTitle}
          onChange={(e) => setBookTitle(e.target.value)}
          onBlur={saveTitle}
          placeholder="e.g. Emma's Birthday"
          className="mt-2 w-full max-w-3xl rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Required to save and preview your book.
        </p>
      </div>
      <h3 className="text-xl font-heading font-bold text-foreground">
        {stepTitle(2, "Step 2: Add a book cover")}
      </h3>
      <div
        className="rounded-2xl border border-border bg-card p-6 max-w-3xl w-full"
        aria-busy={isUploadingCover}
      >
        <h2 className="font-heading font-semibold text-foreground">
          Add an image for your book cover
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {product ? (
            <>
              Upload a full-color, portrait image for your cover. For best
              results, use at least{" "}
              <span className="font-semibold">
                {product.recommendedMinWidthPx} ×{" "}
                {product.recommendedMinHeightPx} px
              </span>{" "}
              and keep important details away from the edges. You can crop &
              rotate it after upload to match your book size.
            </>
          ) : (
            <>
              Upload a full-color, portrait image for your cover. For best
              results, use a high-resolution image and keep important details
              away from the edges. You can crop & rotate it after upload.
            </>
          )}
        </p>
        <div className="mt-4 max-w-xl">
          <UploadConsentCheckbox
            id={`cover-upload-consent-${bookId}`}
            checked={coverUploadConsent}
            onCheckedChange={setCoverUploadConsent}
            disabled={isUploadingCover}
          />
        </div>
        {(coverUploadMessage || coverUploadError) && (
          <div
            className={`mt-3 rounded-xl border px-3 py-2 text-sm ${
              coverUploadError
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
            }`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start justify-between gap-3">
              <p>
                {coverUploadError
                  ? coverUploadError
                  : (coverUploadMessage ?? null)}
              </p>
              <button
                type="button"
                onClick={() => {
                  setCoverUploadError(null);
                  setCoverUploadMessage(null);
                }}
                className="ml-2 text-xs font-medium underline-offset-2 hover:underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        {cover ? (
          <div className="mt-2 flex flex-col gap-3">
            {"cover_url" in cover && cover.cover_url ? (
              <>
                <div className=" grid grid-cols-1 lg:grid-cols-2 justify-between items-center gap-2 py-2">
                  <button
                    type="button"
                    onClick={() => setCropCoverOpen(true)}
                    className="w-full flex flex-row justify-center items-center gap-2 flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted/50"
                  >
                    <Crop className="h-4 w-4" />
                    Crop / Rotate
                  </button>
                  <label
                    className={`text-center cursor-pointer w-full flex flex-row justify-center items-center gap-2 flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isUploadingCover || !coverUploadConsent
                        ? "pointer-events-none opacity-60"
                        : ""
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                    Replace Cover Image
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={isUploadingCover || !coverUploadConsent}
                      onChange={handleCoverUpload}
                    />
                  </label>
                </div>
                <div className="w-full flex flex-row justify-center items-center">
                  <CoverPrintPreview
                    coverUrl={cover.cover_url}
                    crop_rect={cover.crop_rect ?? null}
                    rotation_degrees={cover.rotation_degrees}
                    trimAspectRatio={
                      product
                        ? product.widthInches / product.heightInches
                        : 9 / 16
                    }
                    maxWidthClassName="max-w-sm"
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Cover image saved, but preview is unavailable. Try reloading the
                page or re-uploading the image.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-2 space-y-3 py-2">
            <label
              className={` cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex flex-row justify-center items-center gap-2 ${
                isUploadingCover || !coverUploadConsent
                  ? "pointer-events-none opacity-60"
                  : ""
              }`}
            >
              <Upload className="h-4 w-4" />
              Upload Cover Image
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={isUploadingCover || !coverUploadConsent}
                onChange={handleCoverUpload}
              />
            </label>
            <p className="text-xs text-muted-foreground">
              JPEG, PNG, or WebP · up to 20 MB.
            </p>
            {isUploadingCover && (
              <div
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs text-muted-foreground"
                role="status"
              >
                <span
                  className="inline-block h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent"
                  aria-hidden
                />
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-foreground">
                    Uploading cover image…
                  </span>
                  <span>This usually takes just a few seconds.</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <h3 className="text-xl font-heading font-bold text-foreground">
        {stepTitle(3, "Step 3: Add pages")}
      </h3>
      <div className="max-w-3xl rounded-2xl border border-border bg-card p-6">
        <h2 className="font-heading font-semibold text-foreground">
          Add pages to your coloring book
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add up to {pageTier} pages. Upload new photos (1 credit each) or add
          from My Saved Pages (no credit). Books are printed double-sided.
        </p>
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              setAddFromSavedOpen(false);
              setAddFromUploadOpen(true);
            }}
            disabled={
              pages.length >= pageTier || totalCredits === 0 || isConverting
            }
            className="w-full flex flex-row justify-center items-center gap-2 flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="h-4 w-4" />
            Upload Photo
          </button>

          <button
            type="button"
            onClick={() => {
              setAddFromUploadOpen(false);
              setAddFromSavedOpen(true);
              loadSaved();
            }}
            disabled={isConverting || pages.length >= pageTier}
            className="w-full flex flex-row justify-center items-center gap-2 flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            Add from Saved Pages
          </button>
        </div>
      </div>

      {addFromUploadOpen && (
        <div className="rounded-2xl border border-border bg-card p-6 relative w-full max-w-3xl">
          <h3 className="font-heading font-semibold text-foreground">
            Upload & Convert a Photo
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Upload a photo and we’ll convert it into a coloring page. Each
            conversion uses one credit.
          </p>

          <div className="mt-4">
            {credits != null && (
              <div className="flex flex-row items-center justify-between my-4 rounded-xl border border-primary bg-muted/20 px-3 py-1 w-full">
                <p className=" text-base font-bold text-primary">
                  {credits.free_remaining} free credits left
                </p>
                {credits.paid_credits > 0 && (
                  <p className=" text-sm text-muted-foreground">
                    Plus {credits.paid_credits} paid
                  </p>
                )}
                <a
                  href="/dashboard/buy-credits"
                  target="_blank"
                  rel="noopener noreferrer"
                  className=" inline-block text-sm font-medium text-primary hover:underline"
                >
                  Buy credits →
                </a>
              </div>
            )}
            {totalCredits === 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                No credits left.{" "}
                <a
                  href="/dashboard/buy-credits"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Buy credits
                </a>{" "}
                to convert more images.
              </p>
            )}
            {!previewFile ? (
              <label
                className={`flex flex-row justify-center items-center gap-2 cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isConverting ? "pointer-events-none opacity-50" : ""
                }`}
              >
                <Image className="h-4 w-4" />
                Select image
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={isConverting || pages.length >= pageTier}
                  onChange={handleFileSelect}
                />
              </label>
            ) : (
              <div className="w-full lg:max-w-3xl h-fit rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-sm font-medium text-foreground">
                  Image preview
                </p>
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="mt-2 aspect-square h-fit w-full rounded-lg border border-border object-cover"
                  />
                )}
                {isConverting ? (
                  <div className="mt-4 rounded-lg border border-border bg-background p-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-block h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent"
                        aria-hidden
                      />
                      <div>
                        <p className="font-medium text-foreground">
                          {conversionStep === "uploading" && "Uploading image…"}
                          {conversionStep === "processing" &&
                            "Processing with AI…"}
                          {conversionStep === "preparing" && "Preparing image…"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {conversionStep === "uploading" &&
                            "Sending your photo to the server."}
                          {conversionStep === "processing" &&
                            "AI is turning your photo into a coloring page."}
                          {conversionStep === "preparing" &&
                            "Almost done—saving your page."}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="mt-2 text-sm text-amber-600 dark:text-amber-500">
                      This conversion uses 1 credit.
                    </p>
                    <div className="mt-4 max-w-xl">
                      <UploadConsentCheckbox
                        id={`book-page-upload-consent-${bookId}`}
                        checked={uploadConsentPage}
                        onCheckedChange={setUploadConsentPage}
                        disabled={isConverting}
                      />
                    </div>
                    {convertError && (
                      <p className="mt-1 text-sm text-destructive">
                        {convertError}
                      </p>
                    )}
                    <div className="mt-3 flex flex-row gap-2">
                      <button
                        type="button"
                        onClick={handleStartConvert}
                        disabled={
                          totalCredits === 0 ||
                          pages.length >= pageTier ||
                          !uploadConsentPage
                        }
                        className="rounded-lg flex flex-1 flex-row justify-center items-center gap-2 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 whitespace-nowrap"
                      >
                        <Pencil className="h-4 w-4" />
                        Convert to Coloring Book Page
                      </button>
                      <button
                        type="button"
                        onClick={clearPreview}
                        className="rounded-lg flex flex-row justify-center items-center gap-2 border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/50 whitespace-nowrap"
                      >
                        <Upload className="h-4 w-4" />
                        Choose a Different Image
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setAddFromUploadOpen(false)}
            className="absolute top-2 right-6 mt-4 text-sm text-muted-foreground hover:underline"
          >
            Close
          </button>
        </div>
      )}

      {addFromSavedOpen && (
        <div className="rounded-2xl border border-border bg-card p-6 max-w-3xl w-full relative">
          <h3 className="font-heading font-semibold">Choose a saved page</h3>
          <div className="mt-4 grid grid-cols-3 gap-4">
            {savedList.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => addPageFromSaved(c.id)}
                disabled={addingSavedId !== null}
                className="aspect-square flex flex-col rounded-lg border border-border bg-muted/20 overflow-hidden hover:bg-muted/50 disabled:opacity-50 disabled:pointer-events-none"
              >
                <div className="flex-1 min-h-0 w-full relative">
                  {savedPageUrls[c.id] ? (
                    <img
                      src={savedPageUrls[c.id]}
                      alt="Saved page"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
                      Loading…
                    </div>
                  )}
                </div>
                <span className="p-2 text-sm font-medium">
                  {addingSavedId === c.id ? "Adding…" : "Add"}
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setAddFromSavedOpen(false)}
            className="absolute top-2 right-6 mt-4 text-sm text-muted-foreground hover:underline"
          >
            Close
          </button>
        </div>
      )}

      <h3 className="text-xl font-heading font-bold text-foreground">
        {stepTitle(4, "Step 4: Arrange pages in book")}
      </h3>
      <div className="rounded-2xl border border-border bg-card p-6 max-w-3xl w-full">
        <h2 className="font-heading font-semibold text-foreground">
          Pages ({pages.length} of {pageTier})
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {product
            ? `Book size: ${product.label} ${product.widthInches}" × ${product.heightInches}". `
            : "Book size: —. "}
          Drag to reorder. Each page = one image.
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
              className={`cursor-grab rounded-lg border border-border bg-muted/20 overflow-hidden relative active:cursor-grabbing group ${draggedIndex === i ? "opacity-50" : ""}`}
              style={{
                aspectRatio: product
                  ? `${product.widthInches} / ${product.heightInches}`
                  : "1",
              }}
            >
              {p.outline_url ? (
                <PageTrimUniformPreview
                  imageUrl={p.outline_url}
                  crop_rect={p.crop_rect ?? null}
                  rotation_degrees={p.rotation_degrees}
                  ariaLabel={`Page ${i + 1} preview`}
                />
              ) : null}
              <span className="absolute left-2 top-2 z-10 rounded bg-black/60 px-2 py-1 text-xs text-white">
                {i + 1}
              </span>
              <div className="flex flex-col gap-2 absolute left-1/2 -translate-x-1/2 bottom-2 z-10 opacity-0 transition-opacity group-hover:opacity-100 w-full px-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditPageId(p.id);
                  }}
                  className="flex flex-1 w-full rounded bg-black/60 px-2 py-2 text-xs text-white hover:bg-black/80 whitespace-nowrap flex-row justify-center items-center gap-2"
                >
                  <Crop className="h-4 w-4" />
                  Crop & Rotate
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRemovePageId(p.id);
                  }}
                  className="flex flex-1 w-full rounded bg-black/60 px-2 py-2 flex-row justify-center items-center gap-2 text-xs text-white hover:bg-red-600"
                >
                  <Trash className="h-4 w-4" />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editPageId &&
        (() => {
          const p = pages.find((x) => x.id === editPageId);
          if (!p?.outline_url || !product) return null;
          const aspectRatio = product.widthInches / product.heightInches;
          return (
            <CropRotateEditor
              imageUrl={p.outline_url}
              cropRect={p.crop_rect ?? null}
              rotationDegrees={p.rotation_degrees ?? 0}
              aspectRatio={aspectRatio}
              sizeLabel={`${product.widthInches} × ${product.heightInches} in`}
              label={`Page ${pages.findIndex((x) => x.id === p.id) + 1}`}
              onSave={async (cropRect, rotationDegrees) => {
                setSavingEdit(true);
                try {
                  const res = await fetch(
                    `/api/books/${bookId}/pages/${p.id}`,
                    {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        crop_rect: cropRect,
                        rotation_degrees: rotationDegrees,
                      }),
                    },
                  );
                  if (res.ok) {
                    setPages((prev) =>
                      prev.map((pg) =>
                        pg.id === p.id
                          ? {
                              ...pg,
                              crop_rect: cropRect,
                              rotation_degrees: rotationDegrees,
                            }
                          : pg,
                      ),
                    );
                    setEditPageId(null);
                  }
                } finally {
                  setSavingEdit(false);
                }
              }}
              onCancel={() => setEditPageId(null)}
            />
          );
        })()}

      {cropCoverOpen && cover?.cover_url && product && (
        <CropRotateEditor
          imageUrl={cover.cover_url}
          cropRect={cover.crop_rect ?? null}
          rotationDegrees={cover.rotation_degrees ?? 0}
          aspectRatio={product.widthInches / product.heightInches}
          sizeLabel={`${product.widthInches} × ${product.heightInches} in`}
          label="Cover"
          onSave={async (cropRect, rotationDegrees) => {
            setSavingEdit(true);
            try {
              const res = await fetch(`/api/books/${bookId}/cover`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  crop_rect: cropRect,
                  rotation_degrees: rotationDegrees,
                }),
              });
              if (res.ok && cover) {
                setCover({
                  ...cover,
                  crop_rect: cropRect,
                  rotation_degrees: rotationDegrees,
                });
                setCropCoverOpen(false);
              }
            } finally {
              setSavingEdit(false);
            }
          }}
          onCancel={() => setCropCoverOpen(false)}
        />
      )}

      {removePageId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-lg max-w-3xl">
            <p className="font-medium text-foreground">Remove this page?</p>
            <p className="mt-2 text-sm text-muted-foreground">
              The page will stay in My Saved Pages. You can add it back anytime.
            </p>
            <div className="mt-6 flex gap-3 justify-end">
              <button
                type="button"
                disabled={removing}
                onClick={() => setRemovePageId(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted/50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={removing}
                onClick={() => handleRemovePage(removePageId)}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {removing ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      <h3 className="text-xl font-heading font-bold text-foreground">
        {stepTitle(5, "Step 5: Preview your book")}
      </h3>
      <div className="sticky bottom-0 flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-lg max-w-3xl w-full z-30">
        <div>
          <p className="font-medium text-foreground">
            {pages.length} of {pageTier} pages
          </p>
          {priceError && (
            <p className="mt-1 text-sm text-destructive" role="alert">
              {priceError}{" "}
              <button
                type="button"
                onClick={() => void fetchPrice()}
                className="font-medium text-primary underline hover:no-underline"
              >
                Retry
              </button>
            </p>
          )}
          {estimatedTotalCents !== null && !priceError && (
            <p className="mt-1 text-sm text-muted-foreground">
              Est. total: ${Math.round(estimatedTotalCents / 100)} (Standard
              shipping)
            </p>
          )}
        </div>
        {canPreview ? (
          <Link
            href={`/dashboard/books/${bookId}/preview`}
            className="rounded-lg flex flex-row justify-center items-center gap-2 bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90 whitespace-nowrap"
          >
            <Eye className="h-4 w-4" />
            Preview My Book
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">
            {!bookTitle.trim()
              ? "Add a book name, then fill all pages and add a cover to preview."
              : pages.length !== pageTier
                ? `Add ${pageTier - pages.length} more page(s) (${pageTier} total) and a cover to preview.`
                : "Add a cover to preview."}
          </span>
        )}
      </div>
    </>
  );
}
