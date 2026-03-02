/**
 * Lulu Print API client: auth, cover dimensions, create print job.
 * Env: LULU_CLIENT_KEY, LULU_CLIENT_SECRET, LULU_API_BASE_URL (e.g. https://api.lulu.com or https://api.sandbox.lulu.com)
 */

const POD_PACKAGE_ID = "0850X0850BWSTDPB060UW444MXX";

let cachedToken: { access_token: string; expires_at: number } | null = null;

function getBaseUrl(): string {
  const url = process.env.LULU_API_BASE_URL ?? "";
  return url.replace(/\/$/, "");
}

async function getAccessToken(): Promise<string> {
  const key = process.env.LULU_CLIENT_KEY;
  const secret = process.env.LULU_CLIENT_SECRET;
  if (!key || !secret) {
    throw new Error("LULU_CLIENT_KEY and LULU_CLIENT_SECRET are required");
  }
  const now = Date.now();
  if (cachedToken && cachedToken.expires_at > now + 60_000) {
    return cachedToken.access_token;
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
  cachedToken = {
    access_token: data.access_token,
    expires_at: now + expiresIn,
  };
  return data.access_token;
}

export type CoverDimensions = { widthPoints: number; heightPoints: number };

/**
 * Get required cover dimensions for the given page count and product.
 * Returns width and height in print points (1/72 inch).
 */
export async function getCoverDimensions(
  interiorPageCount: number
): Promise<CoverDimensions> {
  const token = await getAccessToken();
  const base = getBaseUrl();
  const url = `${base}/cover-dimensions/`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      pod_package_id: POD_PACKAGE_ID,
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
  shippingAddress: LuluShippingAddress;
  shippingLevel: "MAIL" | "PRIORITY_MAIL" | "EXPEDITED" | "GROUND" | "EXPRESS";
  quantity?: number;
  productionDelayMinutes?: number;
};

/**
 * Create a print job. Returns the Lulu print job id.
 */
export async function createPrintJob(params: CreatePrintJobParams): Promise<number> {
  const token = await getAccessToken();
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
          pod_package_id: POD_PACKAGE_ID,
          cover: { source_url: params.coverPdfUrl },
          interior: { source_url: params.interiorPdfUrl },
        },
      },
    ],
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
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
  const token = await getAccessToken();
  const base = getBaseUrl();
  const url = `${base}/print-jobs/${printJobId}/status/`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
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
