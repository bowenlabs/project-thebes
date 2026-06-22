import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Zero violations is the bar (issue #15's acceptance criteria) — scans
// every public route this Worker actually serves. Admin Panel routes
// (Worker 2 — Cadmea, behind auth) aren't covered here; that needs its
// own dev server and is a follow-up, not part of this pass.
const routes = ["/", "/login", "/about", "/contact", "/home"];

for (const route of routes) {
  test(`${route} has no axe violations`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual(
      [],
    );
  });
}

test("404 page has no axe violations", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist");
  expect(response?.status()).toBe(404);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual(
    [],
  );
});
