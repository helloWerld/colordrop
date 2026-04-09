/**
 * In-memory rate limiting. PRD §10.3: 10 uploads/min, 20 conversions/hour per user.
 * Resets on cold start; not coordinated across serverless instances.
 */

const uploadCounts = new Map<string, { count: number; resetAt: number }>();
const conversionCounts = new Map<string, { count: number; resetAt: number }>();

const UPLOAD_WINDOW_MS = 60 * 1000;
const UPLOAD_MAX = 10;
const CONVERSION_WINDOW_MS = 60 * 60 * 1000;
const CONVERSION_MAX = 20;

function getOrCreate(
  map: Map<string, { count: number; resetAt: number }>,
  key: string,
  windowMs: number
): { count: number; resetAt: number } {
  const now = Date.now();
  const entry = map.get(key);
  if (entry && entry.resetAt > now) return entry;
  const next = { count: 0, resetAt: now + windowMs };
  map.set(key, next);
  return next;
}

export function checkUploadLimit(userId: string): {
  ok: boolean;
  retryAfter?: number;
} {
  const entry = getOrCreate(uploadCounts, userId, UPLOAD_WINDOW_MS);
  if (entry.count >= UPLOAD_MAX) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - Date.now()) / 1000) };
  }
  entry.count++;
  return { ok: true };
}

export function checkConversionLimit(userId: string): {
  ok: boolean;
  retryAfter?: number;
} {
  const entry = getOrCreate(conversionCounts, userId, CONVERSION_WINDOW_MS);
  if (entry.count >= CONVERSION_MAX) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - Date.now()) / 1000) };
  }
  entry.count++;
  return { ok: true };
}
