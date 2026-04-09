"use client";

import { useState } from "react";
import Link from "next/link";
import { UploadConsentCheckbox } from "@/components/upload-consent-checkbox";

export default function ConvertPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadConsent, setUploadConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [credits, setCredits] = useState<{
    free_remaining: number;
    paid_credits: number;
  } | null>(null);

  const loadCredits = async () => {
    const res = await fetch("/api/credits");
    if (res.ok) {
      const data = await res.json();
      setCredits(data);
    }
  };

  if (credits === null && !loading) {
    loadCredits();
  }

  const totalCredits =
    credits != null ? credits.free_remaining + credits.paid_credits : 0;

  const handleConvert = async () => {
    if (!file) {
      setError("Please select an image.");
      return;
    }
    if (!uploadConsent) {
      setError("Please confirm the upload agreement before converting.");
      return;
    }
    setError(null);
    setResultUrl(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
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
      const convertRes = await fetch("/api/pages/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storage_path: path,
          conversion_context: "one_off",
          upload_consent: true,
        }),
      });
      if (convertRes.status === 402) {
        setError("No credits left. Buy more credits to continue.");
        setLoading(false);
        return;
      }
      if (!convertRes.ok) {
        const data = await convertRes.json().catch(() => ({}));
        const msg = data?.error || `Conversion failed (${convertRes.status})`;
        throw new Error(msg);
      }
      const data = await convertRes.json();
      setResultUrl(data.outline_url ?? null);
      loadCredits();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!resultUrl) return;
    const w = window.open(resultUrl, "_blank");
    w?.addEventListener("load", () => w.print());
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

      {credits != null && (
        <p className="text-sm text-muted-foreground">
          {credits.free_remaining > 0
            ? "This conversion uses 1 free credit."
            : "This conversion uses 1 paid credit."}{" "}
          ({credits.free_remaining} free left, {credits.paid_credits} paid)
        </p>
      )}

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <label className="block font-medium text-foreground">Image</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setUploadConsent(false);
            setResultUrl(null);
            setError(null);
          }}
          className="mt-2 block w-full text-sm text-muted-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
        />

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <div className="mt-4">
          <UploadConsentCheckbox
            id="convert-upload-consent"
            checked={uploadConsent}
            onCheckedChange={setUploadConsent}
            disabled={loading}
          />
        </div>

        <button
          type="button"
          onClick={handleConvert}
          disabled={
            loading || !file || totalCredits === 0 || !uploadConsent
          }
          className="mt-6 w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Converting..." : "Convert"}
        </button>
      </div>

      {resultUrl && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-heading font-semibold text-foreground">
            Your coloring page
          </h2>
          <img
            src={resultUrl}
            alt="Coloring page result"
            className="mt-4 max-h-[400px] w-full object-contain rounded-lg border border-border"
          />
          <div className="mt-4 flex flex-wrap gap-4">
            <a
              href={resultUrl}
              download="coloring-page.png"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Download
            </a>
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/50"
            >
              Print
            </button>
            <Link
              href="/dashboard/books/new"
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/50"
            >
              Add to Book
            </Link>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Saved to My Saved Pages. Credits are used only for conversions; book
            price is separate.
          </p>
        </div>
      )}
    </div>
  );
}
