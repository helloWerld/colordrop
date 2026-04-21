"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { UploadConsentCheckbox } from "@/components/upload-consent-checkbox";
import { Image, Wand2 } from "lucide-react";

type Credits = {
  free_remaining: number;
  paid_credits: number;
};

type ConversionStep = "uploading" | "processing" | "preparing";

export default function ConvertPage() {
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadConsent, setUploadConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [conversionStep, setConversionStep] = useState<ConversionStep | null>(
    null,
  );
  const preparingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [, setSavedConversionId] = useState<string | null>(null);
  const [credits, setCredits] = useState<Credits | null>(null);

  const loadCredits = useCallback(async () => {
    const res = await fetch("/api/credits");
    if (res.ok) {
      const data = await res.json();
      setCredits(data);
    }
  }, []);

  useEffect(() => {
    void loadCredits();
  }, [loadCredits]);

  useEffect(() => {
    return () => {
      if (preparingTimeoutRef.current) {
        clearTimeout(preparingTimeoutRef.current);
        preparingTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const totalCredits =
    credits != null ? credits.free_remaining + credits.paid_credits : 0;

  const clearPreparingTimeout = () => {
    if (preparingTimeoutRef.current) {
      clearTimeout(preparingTimeoutRef.current);
      preparingTimeoutRef.current = null;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;
    const next = fileList[0];
    setPreviewFile(next);
    setPreviewUrl(URL.createObjectURL(next));
    setUploadConsent(false);
    setError(null);
    e.target.value = "";
  };

  const clearSourceOnly = () => {
    setPreviewUrl(null);
    setPreviewFile(null);
    setUploadConsent(false);
    setError(null);
  };

  const startNewConversion = () => {
    clearSourceOnly();
    setResultUrl(null);
    setSavedConversionId(null);
    void loadCredits();
  };

  const handleConvert = async () => {
    if (!previewFile) {
      setError("Please select an image.");
      return;
    }
    if (!uploadConsent) {
      setError("Please confirm the upload agreement before converting.");
      return;
    }
    setError(null);
    setLoading(true);
    setConversionStep("uploading");
    clearPreparingTimeout();

    try {
      const formData = new FormData();
      formData.append("file", previewFile);
      formData.append("upload_consent", "true");
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) {
        const data = await uploadRes.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
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
          conversion_context: "one_off",
          upload_consent: true,
        }),
      });

      clearPreparingTimeout();

      if (convertRes.status === 402) {
        const data = await convertRes.json().catch(() => ({}));
        setError(
          typeof data?.message === "string"
            ? data.message
            : "No conversion credits left. Buy more credits.",
        );
        await loadCredits();
        return;
      }
      if (!convertRes.ok) {
        const data = await convertRes.json().catch(() => ({}));
        const msg = data?.error || `Conversion failed (${convertRes.status})`;
        throw new Error(msg);
      }
      const data = await convertRes.json();
      setResultUrl(data.outline_url ?? null);
      if (typeof data.saved_conversion_id === "string") {
        setSavedConversionId(data.saved_conversion_id);
      }
      await loadCredits();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      await loadCredits();
    } finally {
      setLoading(false);
      setConversionStep(null);
      clearPreparingTimeout();
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold text-foreground">
          Convert an Image
        </h1>
        <p className="mt-1 text-muted-foreground">
          Use one credit to turn a photo into a coloring page. Result is saved
          to My Saved Pages.
        </p>
      </div>

      {!resultUrl && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <label className="block font-medium text-foreground">Image</label>

          {credits != null && (
            <div className="mt-4 flex w-full flex-row items-center justify-between rounded-xl border border-primary bg-primary/5 px-3 py-2">
              <p className="text-base font-bold text-primary">
                {totalCredits} credits available
              </p>
              <a
                href="/dashboard/buy-credits"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary hover:underline"
              >
                Buy credits →
              </a>
            </div>
          )}

          {totalCredits === 0 && credits != null && (
            <p className="mt-3 text-sm text-muted-foreground">
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

          <div className="mt-4">
            {!previewFile ? (
              <label
                className={`flex cursor-pointer flex-row items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 ${
                  loading ? "pointer-events-none opacity-50" : ""
                }`}
              >
                <Image className="h-4 w-4" aria-hidden />
                Select image
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={loading}
                  onChange={handleFileSelect}
                />
              </label>
            ) : (
              <div className="w-full rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-sm font-medium text-foreground">
                  Image preview
                </p>
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Original preview"
                    className="mt-2 aspect-square h-fit w-full rounded-lg border border-border object-contain"
                  />
                )}
                {loading ? (
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
                      {credits != null && credits.free_remaining > 0
                        ? "This conversion uses 1 free credit."
                        : "This conversion uses 1 paid credit."}
                    </p>
                    {error && (
                      <p className="mt-2 text-sm text-destructive">{error}</p>
                    )}
                    <div className="mt-4 max-w-xl">
                      <UploadConsentCheckbox
                        id="convert-upload-consent"
                        checked={uploadConsent}
                        onCheckedChange={setUploadConsent}
                        disabled={loading}
                      />
                    </div>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={handleConvert}
                        disabled={
                          loading || totalCredits === 0 || !uploadConsent
                        }
                        className="flex flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      >
                        <Wand2 className="h-4 w-4" aria-hidden />
                        Convert
                      </button>
                      <button
                        type="button"
                        onClick={clearSourceOnly}
                        disabled={loading}
                        className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/50 disabled:opacity-50"
                      >
                        Change image
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {resultUrl && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-heading font-semibold text-foreground">
            Your coloring page
          </h2>
          <img
            src={resultUrl}
            alt="Coloring page result"
            className="mt-4 max-h-[400px] w-full rounded-lg border border-border object-contain"
          />
          <div className="mt-4 flex w-full flex-col flex-wrap items-center justify-between gap-4">
            <div className="flex flex-row gap-4 flex-wrap">
              <a
                href={resultUrl}
                download="coloring-page.png"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/50 flex-1 whitespace-nowrap text-center"
              >
                Download / Print
              </a>
              <Link
                href="/dashboard/books/new"
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/50 flex-1 whitespace-nowrap text-center"
              >
                Add to Book
              </Link>
              <Link
                href="/dashboard/saved-pages"
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/50  flex-1 whitespace-nowrap text-center"
              >
                View Your Saved Pages
              </Link>
            </div>
            <button
              type="button"
              onClick={startNewConversion}
              className="rounded-lg border border-border bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 mt-4 w-full"
            >
              Convert another image
            </button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Your newest page appears at the top of My Saved Pages. Credits are
            used only for conversions; book price is separate.
          </p>
        </div>
      )}
    </div>
  );
}
