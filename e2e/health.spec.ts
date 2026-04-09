import { test, expect } from "@playwright/test";

test("health endpoint responds with JSON", async ({ request }) => {
  const res = await request.get("/api/health");
  // In local dev this may be 200 or 503 depending on configured env/deps,
  // but it should always respond with JSON.
  expect([200, 503]).toContain(res.status());
  const body = (await res.json()) as { ok: boolean; timestamp: string };
  expect(typeof body.ok).toBe("boolean");
  expect(typeof body.timestamp).toBe("string");
});

