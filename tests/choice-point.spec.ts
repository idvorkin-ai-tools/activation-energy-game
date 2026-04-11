import { test, expect } from "@playwright/test";

test.describe("Choice Point lesson", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/lessons/choice-point/");
  });

  test("page loads with header and game container", async ({ page }) => {
    await expect(page.locator("#header")).toBeVisible();
    await expect(page.locator("#game")).toBeVisible();
  });

  test("about modal opens and closes", async ({ page }) => {
    await page.click("#about-link");
    await expect(page.locator("#about-modal")).not.toHaveClass(/modal-hidden/);
    await page.click("#modal-close");
    await expect(page.locator("#about-modal")).toHaveClass(/modal-hidden/);
  });
});
