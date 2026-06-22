import { expect, test } from "@playwright/test";

// Smoke-tests the magic-link request flow through a real browser — the
// login form posts to /api/auth/magic-link and always shows a generic
// "check your email" state (never confirms/denies a registered email,
// see app/workers/site/src/api.ts).
test("login page accepts an email and shows the check-your-email state", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("owner@example.com");
  await page.getByRole("button", { name: /sign in|send|continue/i }).click();
  await expect(page.getByText(/check your email/i)).toBeVisible();
});

test("verify rejects an invalid token", async ({ page }) => {
  const response = await page.goto("/api/auth/verify?token=not-a-real-token");
  expect(response?.url()).toContain("error=invalid");
});
