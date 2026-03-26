/**
 * Lulu Print API client: auth, cover dimensions, create print job.
 * Env: LULU_CLIENT_KEY, LULU_CLIENT_SECRET, LULU_API_BASE_URL (production).
 * Sandbox: LULU_USE_SANDBOX=true, LULU_SANDBOX_CLIENT_KEY, LULU_SANDBOX_CLIENT_SECRET, LULU_SANDBOX_API_BASE_URL.
 * If LULU_USE_SANDBOX=true but sandbox keys are missing, production Lulu is used when LULU_CLIENT_KEY / LULU_CLIENT_SECRET are set.
 * pod_package_id is passed per request (from book product config).
 */

import type { ShippingAddressInput } from "./validators";
import { normalizeUsStateCodeForLulu } from "./us-state";

function wantsLuluSandbox(): boolean {
  return process.env.LULU_USE_SANDBOX === "true";
}

function hasSandboxCredentials(): boolean {
  return !!(
    process.env.LULU_SANDBOX_CLIENT_KEY && process.env.LULU_SANDBOX_CLIENT_SECRET
  );
}

/**
 * True when API calls use the sandbox base URL and sandbox credentials.
 * Requires both LULU_USE_SANDBOX=true and sandbox keys; otherwise production is used (if prod keys exist).
 */
export function isLuluSandbox(): boolean {
  return wantsLuluSandbox() && hasSandboxCredentials();
}

let warnedSandboxFallbackToProd = false;

function maybeWarnSandboxFallbackToProd(): void {
  if (
    warnedSandboxFallbackToProd ||
    !wantsLuluSandbox() ||
    hasSandboxCredentials()
  ) {
    return;
  }
  const prodKeysSet = !!(
    process.env.LULU_CLIENT_KEY && process.env.LULU_CLIENT_SECRET
  );
  if (!prodKeysSet) return;
  warnedSandboxFallbackToProd = true;
  console.warn(
    "[lulu] LULU_USE_SANDBOX=true but LULU_SANDBOX_CLIENT_KEY / LULU_SANDBOX_CLIENT_SECRET are missing; using production Lulu (LULU_CLIENT_KEY / LULU_CLIENT_SECRET). Add sandbox keys or set LULU_USE_SANDBOX=false.",
  );
}

/** Which credential pair is present (for dev/debug; values are booleans only). */
export type LuluCredentialDiagnostics = {
  /** Env flag LULU_USE_SANDBOX=true (may still use production if sandbox keys absent). */
  luluSandboxRequested: boolean;
  /** Actual mode used for Lulu API (matches {@link isLuluSandbox}). */
  luluUseSandbox: boolean;
  activeMode: "sandbox" | "production";
  /** True when the key pair required for the active mode is set. */
  activeKeysSet: boolean;
  sandboxKeysSet: boolean;
  prodKeysSet: boolean;
  hint: string | null;
};

export function getLuluCredentialDiagnostics(): LuluCredentialDiagnostics {
  const sandboxKeysSet = hasSandboxCredentials();
  const prodKeysSet = !!(
    process.env.LULU_CLIENT_KEY && process.env.LULU_CLIENT_SECRET
  );
  const requested = wantsLuluSandbox();
  const effectiveSandbox = requested && sandboxKeysSet;
  const activeKeysSet = effectiveSandbox ? sandboxKeysSet : prodKeysSet;
  let hint: string | null = null;
  if (requested && !sandboxKeysSet && prodKeysSet) {
    hint =
      "LULU_USE_SANDBOX=true but sandbox keys are missing; using production Lulu until LULU_SANDBOX_* are set, or set LULU_USE_SANDBOX=false.";
  } else if (!requested && !prodKeysSet && sandboxKeysSet) {
    hint =
      "Production mode but LULU_CLIENT_KEY / LULU_CLIENT_SECRET are missing; set them or set LULU_USE_SANDBOX=true with sandbox keys.";
  }
  return {
    luluSandboxRequested: requested,
    luluUseSandbox: effectiveSandbox,
    activeMode: effectiveSandbox ? "sandbox" : "production",
    activeKeysSet,
    sandboxKeysSet,
    prodKeysSet,
    hint,
  };
}

type CachedToken = { access_token: string; expires_at: number };
const cachedTokenByMode: { prod: CachedToken | null; sandbox: CachedToken | null } = {
  prod: null,
  sandbox: null,
};

/** Refresh before this much time remains on the cached token (clock skew / JWT vs expires_in). */
const TOKEN_REUSE_BUFFER_MS = 5 * 60_000;

function clearLuluTokenCacheForActiveMode(): void {
  const key = isLuluSandbox() ? "sandbox" : "prod";
  cachedTokenByMode[key] = null;
}

/**
 * Authenticated Lulu API fetch. On 401 (e.g. JWT "Signature has expired"), drops cached token and retries once.
 */
async function fetchWithLuluAuth(url: string, init: RequestInit): Promise<Response> {
  const run = async () => {
    const token = await getAccessToken();
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    return fetch(url, { ...init, headers });
  };
  let res = await run();
  if (res.status === 401) {
    clearLuluTokenCacheForActiveMode();
    res = await run();
  }
  return res;
}

/** Base URL in use (for dev/debug). */
export function getLuluApiBaseUrl(): string {
  return getBaseUrl();
}

function getBaseUrl(): string {
  if (isLuluSandbox()) {
    const url = process.env.LULU_SANDBOX_API_BASE_URL ?? "";
    return url.replace(/\/$/, "");
  }
  const url = process.env.LULU_API_BASE_URL ?? "";
  return url.replace(/\/$/, "");
}

async function getAccessToken(): Promise<string> {
  maybeWarnSandboxFallbackToProd();
  const sandbox = isLuluSandbox();
  const key = sandbox
    ? process.env.LULU_SANDBOX_CLIENT_KEY
    : process.env.LULU_CLIENT_KEY;
  const secret = sandbox
    ? process.env.LULU_SANDBOX_CLIENT_SECRET
    : process.env.LULU_CLIENT_SECRET;
  const required = sandbox
    ? "LULU_SANDBOX_CLIENT_KEY and LULU_SANDBOX_CLIENT_SECRET"
    : "LULU_CLIENT_KEY and LULU_CLIENT_SECRET";
  if (!key || !secret) {
    throw new Error(`${required} are required`);
  }
  const cacheKey = sandbox ? "sandbox" : "prod";
  const cached = cachedTokenByMode[cacheKey];
  const now = Date.now();
  if (cached && cached.expires_at > now + TOKEN_REUSE_BUFFER_MS) {
    return cached.access_token;
  }
  const base = getBaseUrl();
  const tokenUrl = `${base}/auth/realms/glasstree/protocol/openid-connect/token`;
  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_key: key,
      client_secret: secret,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Lulu token failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in?: number };
  const expiresIn = (data.expires_in ?? 3600) * 1000;
  const token: CachedToken = {
    access_token: data.access_token,
    expires_at: now + expiresIn,
  };
  cachedTokenByMode[cacheKey] = token;
  return data.access_token;
}

export type CoverDimensions = { widthPoints: number; heightPoints: number };

/**
 * Get required cover dimensions for the given page count and product.
 * Returns width and height in print points (1/72 inch).
 */
export async function getCoverDimensions(
  interiorPageCount: number,
  podPackageId: string
): Promise<CoverDimensions> {
  const base = getBaseUrl();
  const url = `${base}/cover-dimensions/`;
  const res = await fetchWithLuluAuth(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pod_package_id: podPackageId,
      interior_page_count: interiorPageCount,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Lulu cover dimensions failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { width: string; height: string; unit?: string };
  return {
    widthPoints: parseFloat(data.width) || 612,
    heightPoints: parseFloat(data.height) || 612,
  };
}

export type LuluShippingAddress = {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state_code: string;
  country_code: string;
  postcode: string;
  phone_number: string;
};

export type CreatePrintJobParams = {
  contactEmail: string;
  externalId: string;
  title: string;
  interiorPdfUrl: string;
  coverPdfUrl: string;
  podPackageId: string;
  shippingAddress: LuluShippingAddress;
  shippingLevel: "MAIL" | "PRIORITY_MAIL" | "EXPEDITED" | "GROUND" | "EXPRESS";
  quantity?: number;
  productionDelayMinutes?: number;
};

/**
 * Create a print job. Returns the Lulu print job id.
 * Request shape matches OpenAPI `PrintJob` line_items[].printable_normalization
 * (interior + cover source_url, pod_package_id); see api.lulu.com OpenAPI spec.
 */
export async function createPrintJob(params: CreatePrintJobParams): Promise<number> {
  const base = getBaseUrl();
  const url = `${base}/print-jobs/`;
  const body = {
    contact_email: params.contactEmail,
    external_id: params.externalId,
    shipping_level: params.shippingLevel,
    production_delay: Math.min(2880, Math.max(60, params.productionDelayMinutes ?? 60)),
    shipping_address: {
      name: params.shippingAddress.name,
      street1: params.shippingAddress.street1,
      street2: params.shippingAddress.street2 ?? "",
      city: params.shippingAddress.city,
      state_code: params.shippingAddress.state_code,
      country_code: params.shippingAddress.country_code,
      postcode: params.shippingAddress.postcode,
      phone_number: params.shippingAddress.phone_number,
    },
    line_items: [
      {
        title: params.title,
        quantity: params.quantity ?? 1,
        printable_normalization: {
          pod_package_id: params.podPackageId,
          cover: { source_url: params.coverPdfUrl },
          interior: { source_url: params.interiorPdfUrl },
        },
      },
    ],
  };
  const res = await fetchWithLuluAuth(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Lulu create print job failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { id: number };
  return data.id;
}

/** Address for Lulu cost calculation (representative destination). */
export type LuluCostAddress = {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state_code: string;
  country_code: string;
  postcode: string;
  phone_number: string;
};

export function shippingFormToLuluCostAddress(
  input: ShippingAddressInput
): LuluCostAddress {
  let stateCode = input.state.trim();
  if (input.country === "US") {
    const normalized = normalizeUsStateCodeForLulu(stateCode);
    if (normalized) stateCode = normalized;
  } else if (input.country === "CA") {
    stateCode = stateCode.toUpperCase();
  }
  return {
    name: input.name,
    street1: input.line1,
    street2: input.line2,
    city: input.city,
    state_code: stateCode,
    country_code: input.country,
    postcode: input.postal_code,
    phone_number: input.phone,
  };
}

export type PrintJobCostResult = {
  lineItemCents: number;
  fulfillmentCents: number;
  shippingCents: number;
};

/**
 * Get cost calculation from Lulu (print + fulfillment + shipping) for pricing.
 * Uses POST /print-job-cost-calculations/. Throws if Lulu API fails.
 */
export async function getPrintJobCostCalculation(params: {
  podPackageId: string;
  pageCount: number;
  shippingOption: "MAIL" | "PRIORITY_MAIL" | "EXPEDITED";
  shippingAddress: LuluCostAddress;
}): Promise<PrintJobCostResult> {
  const base = getBaseUrl();
  const url = `${base}/print-job-cost-calculations/`;
  const body = {
    line_items: [
      {
        page_count: params.pageCount,
        pod_package_id: params.podPackageId,
        quantity: 1,
      },
    ],
    shipping_address: {
      name: params.shippingAddress.name,
      street1: params.shippingAddress.street1,
      street2: params.shippingAddress.street2 ?? "",
      city: params.shippingAddress.city,
      state_code: params.shippingAddress.state_code,
      country_code: params.shippingAddress.country_code,
      postcode: params.shippingAddress.postcode,
      phone_number: params.shippingAddress.phone_number,
    },
    shipping_option: params.shippingOption,
  };
  const res = await fetchWithLuluAuth(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Lulu cost calculation failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as {
    line_item_costs?: Array<{ cost_excl_discounts?: string }>;
    fulfillment_cost?: { total_cost_excl_tax?: string };
    shipping_cost?: { total_cost_excl_tax?: string };
  };
  const lineCost = data.line_item_costs?.[0]?.cost_excl_discounts ?? "0";
  const fulfillmentCost = data.fulfillment_cost?.total_cost_excl_tax ?? "0";
  const shippingCost = data.shipping_cost?.total_cost_excl_tax ?? "0";
  return {
    lineItemCents: Math.round(parseFloat(lineCost) * 100),
    fulfillmentCents: Math.round(parseFloat(fulfillmentCost) * 100),
    shippingCents: Math.round(parseFloat(shippingCost) * 100),
  };
}

/**
 * Default US address for cost calculations when env is not set.
 */
export function getDefaultCostCalcAddress(): LuluCostAddress {
  return {
    name: "Cost Calc",
    street1: process.env.LULU_COST_CALC_STREET1 ?? "101 Independence Ave SE",
    city: process.env.LULU_COST_CALC_CITY ?? "Washington",
    state_code: process.env.LULU_COST_CALC_STATE ?? "DC",
    country_code: process.env.LULU_COST_CALC_COUNTRY ?? "US",
    postcode: process.env.LULU_COST_CALC_POSTCODE ?? "20540",
    phone_number: process.env.LULU_COST_CALC_PHONE ?? "+12065550100",
  };
}

export type PrintJobStatus = {
  name: string;
  message?: string;
  tracking_id?: string;
  tracking_url?: string;
};

/**
 * Get print job status (for polling). Use when webhook is not configured.
 */
export async function getPrintJobStatus(printJobId: number): Promise<PrintJobStatus | null> {
  const base = getBaseUrl();
  const url = `${base}/print-jobs/${printJobId}/status/`;
  const res = await fetchWithLuluAuth(url, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    name?: string;
    message?: string;
    tracking_info?: { tracking_id?: string; tracking_url?: string }[];
  };
  const tracking = data.tracking_info?.[0];
  return {
    name: data.name ?? "UNKNOWN",
    message: data.message,
    tracking_id: tracking?.tracking_id,
    tracking_url: tracking?.tracking_url,
  };
}
