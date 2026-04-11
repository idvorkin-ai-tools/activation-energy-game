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

  test("intro screen shows Harris framing and a begin button", async ({ page }) => {
    await expect(page.locator(".cp-intro")).toBeVisible();
    await expect(page.locator(".cp-intro")).toContainText("Harris");
    await expect(page.locator(".cp-begin-btn")).toBeVisible();
    await expect(page.locator(".cp-begin-btn")).toContainText(/tap to begin/i);
  });

  test("arcade layout appears after tapping begin", async ({ page }) => {
    await page.click(".cp-begin-btn");
    await expect(page.locator(".cp-bin-away")).toBeVisible();
    await expect(page.locator(".cp-bin-towards")).toBeVisible();
    await expect(page.locator(".cp-bin-away")).toContainText("AWAY");
    await expect(page.locator(".cp-bin-towards")).toContainText("TOWARDS");
    await expect(page.locator(".cp-decision-line")).toBeVisible();
    // Raccoon canvas (Character class appends a canvas)
    await expect(page.locator(".cp-raccoon-layer canvas")).toBeVisible();
  });
});
