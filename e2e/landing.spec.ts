import { test, expect } from "@playwright/test";

test("landing page loads and shows key content", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/ColorDrop/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /sign in|get started|start/i })).toBeVisible();
});

test("marketing links exist", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /FAQ/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /terms|Terms/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /privacy|Privacy/i })).toBeVisible();
});
