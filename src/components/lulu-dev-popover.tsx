"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

/** Above dashboard sticky bars (z-50) and in-page overlays without fighting modals needlessly. */
const PANEL_Z_INDEX = 10000;
const ANCHOR_GAP_PX = 8;

type LuluCheckPayload = {
  ok: boolean;
  error?: string;
  keysSet?: boolean;
  sample?: { trimSize: string; pageTier: number; shippingLevel: string };
  luluCost?: {
    lineItemCents: number;
    fulfillmentCents: number;
    shippingCents: number;
    totalCostCents: number;
  };
  bookMarkupPercent?: number;
  shippingMarkupPercent?: number;
  marginMarkupCents?: number;
  /** Printing + binding customer price only; matches `/api/price` and the new-book page. */
  printingOnlyCents?: number;
  customer?: {
    bookCents: number;
    shippingCents: number;
    totalCents: number;
  };
};

type LuluDebugPayload = {
  diagnostics: {
    luluSandboxRequested: boolean;
    luluUseSandbox: boolean;
    activeMode: "sandbox" | "production";
    activeKeysSet: boolean;
    sandboxKeysSet: boolean;
    prodKeysSet: boolean;
    hint: string | null;
  };
  apiBaseUrl: string;
  activeCredentials: {
    keyEnv: string;
    keyMasked: string;
    secretEnv: string;
    secretMasked: string;
  };
  production: { bothSet: boolean; keyMasked: string; secretMasked: string };
  sandbox: { bothSet: boolean; keyMasked: string; secretMasked: string };
};

function fmtUsd(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function LuluDevPopover() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<LuluDebugPayload | null>(null);
  const [checkData, setCheckData] = useState<LuluCheckPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCheckData(null);
    try {
      const [debugRes, checkRes] = await Promise.all([
        fetch("/api/dev/lulu-debug"),
        fetch("/api/dev/lulu-check"),
      ]);
      if (!debugRes.ok) {
        setError(
          debugRes.status === 404
            ? "Only available in development."
            : "Failed to load.",
        );
        setData(null);
        return;
      }
      setData(await debugRes.json());
      const checkJson = (await checkRes.json().catch(() => ({}))) as
        | LuluCheckPayload
        | Record<string, unknown>;
      if (checkRes.status === 404) {
        setCheckData({
          ok: false,
          error: "Pricing check only runs in development.",
        });
      } else {
        setCheckData(
          checkJson && typeof checkJson === "object" && "ok" in checkJson
            ? (checkJson as LuluCheckPayload)
            : {
                ok: false,
                error: "Failed to load pricing sample.",
              },
        );
      }
    } catch {
      setError("Failed to load.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  const updatePanelPosition = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn || typeof window === "undefined") return;
    const r = btn.getBoundingClientRect();
    setPanelStyle({
      position: "fixed",
      top: r.bottom + ANCHOR_GAP_PX,
      right: window.innerWidth - r.right,
      width: "min(22rem, calc(100vw - 2rem))",
      zIndex: PANEL_Z_INDEX,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePanelPosition();
    const onMove = () => updatePanelPosition();
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open, updatePanelPosition]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (buttonRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const d = data?.diagnostics;

  const panel =
    open &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        ref={panelRef}
        style={panelStyle}
        className={cn(
          "rounded-lg border border-border bg-popover p-4 text-left text-sm shadow-xl",
          "max-h-[min(70vh,calc(100dvh-5rem))] overflow-y-auto",
        )}
        role="dialog"
        aria-label="Lulu environment (development)"
      >
        {loading && <p className="text-muted-foreground">Loading…</p>}
        {error && <p className="text-destructive">{error}</p>}
        {!loading && !error && data && d && (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Active API
              </p>
              <p
                className={cn(
                  "mt-1 inline-flex rounded-md px-2 py-0.5 text-xs font-semibold",
                  d.luluUseSandbox
                    ? "bg-amber-500/20 text-amber-900 dark:text-amber-100"
                    : "bg-emerald-500/15 text-emerald-900 dark:text-emerald-100",
                )}
              >
                {d.luluUseSandbox ? "Lulu sandbox" : "Lulu production"}
              </p>
              {d.luluSandboxRequested !== d.luluUseSandbox && (
                <p className="mt-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Env flag:</span>{" "}
                  LULU_USE_SANDBOX=
                  {d.luluSandboxRequested ? "true" : "false"} (effective mode
                  may differ if credentials are missing.)
                </p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Base URL
              </p>
              <p className="mt-1 break-all font-mono text-xs text-foreground">
                {data.apiBaseUrl || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Credentials in use (masked)
              </p>
              <dl className="mt-2 space-y-1.5 font-mono text-xs">
                <div className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground">
                    {data.activeCredentials.keyEnv}
                  </dt>
                  <dd className="break-all text-foreground">
                    {data.activeCredentials.keyMasked}
                  </dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground">
                    {data.activeCredentials.secretEnv}
                  </dt>
                  <dd className="break-all text-foreground">
                    {data.activeCredentials.secretMasked}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="border-t border-border pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                All configured (masked)
              </p>
              <div className="mt-2 grid gap-2 text-xs">
                <div>
                  <p className="font-medium text-foreground">Production pair</p>
                  <p className="text-muted-foreground">
                    {data.production.bothSet
                      ? "Both set"
                      : "Incomplete or unset"}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    LULU_CLIENT_KEY: {data.production.keyMasked}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    LULU_CLIENT_SECRET: {data.production.secretMasked}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Sandbox pair</p>
                  <p className="text-muted-foreground">
                    {data.sandbox.bothSet ? "Both set" : "Incomplete or unset"}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    LULU_SANDBOX_CLIENT_KEY: {data.sandbox.keyMasked}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    LULU_SANDBOX_CLIENT_SECRET: {data.sandbox.secretMasked}
                  </p>
                </div>
              </div>
            </div>

            {d.hint && (
              <p className="border-t border-border pt-3 text-xs text-muted-foreground">
                {d.hint}
              </p>
            )}

            <div className="border-t border-border pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Pricing sample (large, 32p, MAIL)
              </p>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                “Customer printing only” matches the new-book page when you pick
                the same trim and page tier. “Stripe book/ship lines” are how
                the full order total is split for payment and include shipping
                margin.
              </p>
              {!checkData && (
                <p className="mt-2 text-xs text-muted-foreground">—</p>
              )}
              {checkData && !checkData.ok && (
                <p className="mt-2 text-xs text-destructive">
                  {checkData.error ?? "Check failed."}
                </p>
              )}
              {checkData?.ok && checkData.luluCost && checkData.customer && (
                <dl className="mt-2 space-y-1.5 font-mono text-[11px] text-foreground">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Lulu line item</dt>
                    <dd>{fmtUsd(checkData.luluCost.lineItemCents)}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Lulu fulfillment</dt>
                    <dd>{fmtUsd(checkData.luluCost.fulfillmentCents)}</dd>
                  </div>
                  <div className="flex justify-between gap-2 font-medium">
                    <dt className="text-muted-foreground">
                      Lulu print total{" "}
                      <span className="font-normal text-foreground/70">
                        (line + fulfillment)
                      </span>
                    </dt>
                    <dd>
                      {fmtUsd(
                        checkData.luluCost.lineItemCents +
                          checkData.luluCost.fulfillmentCents,
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Lulu shipping</dt>
                    <dd>{fmtUsd(checkData.luluCost.shippingCents)}</dd>
                  </div>
                  <div className="flex justify-between gap-2 font-medium">
                    <dt className="text-muted-foreground">Lulu total cost</dt>
                    <dd>{fmtUsd(checkData.luluCost.totalCostCents)}</dd>
                  </div>
                  <div className="flex justify-between gap-2 border-t border-border pt-1.5">
                    <dt className="text-muted-foreground">Markup</dt>
                    <dd className="text-right">
                      Book {checkData.bookMarkupPercent ?? "—"}% · Ship{" "}
                      {checkData.shippingMarkupPercent ?? "—"}% (
                      {checkData.marginMarkupCents != null
                        ? fmtUsd(checkData.marginMarkupCents)
                        : "—"}{" "}
                      total)
                    </dd>
                  </div>
                  {checkData.printingOnlyCents != null && (
                    <div className="flex justify-between gap-2 font-medium">
                      <dt className="text-muted-foreground">
                        Customer printing only{" "}
                        <span className="font-normal text-foreground/70">
                          (no shipping)
                        </span>
                      </dt>
                      <dd>{fmtUsd(checkData.printingOnlyCents)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-2 text-foreground/80">
                    <dt className="text-muted-foreground">
                      Stripe book line{" "}
                      <span className="font-normal text-foreground/70">
                        (split of full order)
                      </span>
                    </dt>
                    <dd>{fmtUsd(checkData.customer.bookCents)}</dd>
                  </div>
                  <div className="flex justify-between gap-2 text-foreground/80">
                    <dt className="text-muted-foreground">
                      Stripe ship line{" "}
                      <span className="font-normal text-foreground/70">
                        (split of full order)
                      </span>
                    </dt>
                    <dd>{fmtUsd(checkData.customer.shippingCents)}</dd>
                  </div>
                  <div className="flex justify-between gap-2 font-medium">
                    <dt className="text-muted-foreground">Customer total</dt>
                    <dd>{fmtUsd(checkData.customer.totalCents)}</dd>
                  </div>
                </dl>
              )}
            </div>
          </div>
        )}
      </div>,
      document.body,
    );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border border-dashed border-amber-500/50 bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-900 dark:text-amber-100",
          "hover:bg-amber-500/20",
        )}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <FlaskConical className="h-3.5 w-3.5 shrink-0 opacity-80" />
        Lulu
      </button>
      {panel}
    </div>
  );
}
