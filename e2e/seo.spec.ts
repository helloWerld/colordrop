import { test, expect } from "@playwright/test";

test("sitemap.xml lists public URLs", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.ok()).toBeTruthy();
  const body = await res.text();
  expect(body).toContain("<urlset");
  expect(body).toContain("/pricing");
  expect(body).toContain("/faq");
  expect(body).toMatch(/<loc>/);
});

test("robots.txt allows site and disallows private areas", async ({
  request,
}) => {
  const res = await request.get("/robots.txt");
  expect(res.ok()).toBeTruthy();
  const body = await res.text();
  expect(body).toMatch(/Allow:\s*\/?/i);
  expect(body).toContain("Disallow: /dashboard");
  expect(body).toContain("Disallow: /api");
  expect(body).toContain("Disallow: /admin");
  expect(body).toContain("sitemap.xml");
});
