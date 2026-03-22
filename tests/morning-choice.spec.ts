import { test, expect } from "@playwright/test";

test.describe("Morning Choice lesson", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/lessons/morning-choice/");
    await page.waitForTimeout(1000);
  });

  test("page loads with header and game", async ({ page }) => {
    await expect(page.locator("#header")).toBeVisible();
    await expect(page.locator("#room-canvas")).toBeVisible();
    await expect(page.locator(".mc-energy-bar")).toBeVisible();
  });

  test("about modal opens and closes", async ({ page }) => {
    await page.click("#about-link");
    await expect(page.locator("#about-modal")).not.toHaveClass(/modal-hidden/);
    await page.click("#modal-close");
    await expect(page.locator("#about-modal")).toHaveClass(/modal-hidden/);
  });

  test("initial state shows alarm beat", async ({ page }) => {
    await expect(page.locator(".mc-narrative")).toContainText("alarm", { timeout: 5000 });
    const buttons = page.locator(".mc-btn");
    await expect(buttons).toHaveCount(2);
    await expect(buttons.first()).toContainText("5 more minutes");
    await expect(buttons.last()).toContainText("Get up");
  });

  test("stay path progresses through beats", async ({ page }) => {
    await page.click(".mc-btn-stay");
    await page.waitForTimeout(600);
    await expect(page.locator(".mc-narrative")).toContainText("alarm again", { ignoreCase: true, timeout: 5000 });

    await page.click(".mc-btn-stay");
    await page.waitForTimeout(600);
    await expect(page.locator(".mc-narrative")).toContainText("awake", { timeout: 5000 });

    await page.click(".mc-btn-stay");
    await page.waitForTimeout(600);
    await expect(page.locator(".mc-narrative")).toContainText("phone", { timeout: 5000 });

    await page.click(".mc-btn-stay");
    await page.waitForTimeout(600);
    await expect(page.locator(".mc-narrative")).toContainText("chair", { timeout: 5000 });
  });

  test("energy bar updates on stay path", async ({ page }) => {
    await expect(page.locator(".mc-energy-label")).toContainText("70");
    await page.click(".mc-btn-stay");
    await page.waitForTimeout(800);
    await expect(page.locator(".mc-energy-label")).toContainText("55");
  });

  test("clicking get up shows drag hint", async ({ page }) => {
    await page.click(".mc-btn-go");
    await page.waitForTimeout(500);
    await expect(page.locator(".mc-drag-hint")).toBeVisible();
    await expect(page.locator(".mc-drag-hint")).toContainText("Drag the raccoon");
  });

  test("retry button restarts the game", async ({ page }) => {
    for (let i = 0; i < 4; i++) {
      await page.click(".mc-btn-stay");
      await page.waitForTimeout(600);
    }
    await page.waitForTimeout(5000);
    await page.click(".mc-retry", { timeout: 10000 });
    await page.waitForTimeout(600);
    await expect(page.locator(".mc-narrative")).toContainText("alarm", { ignoreCase: true, timeout: 5000 });
  });

  test("hub page has morning choice card", async ({ page }) => {
    await page.goto("/");
    const card = page.locator('a[href="/lessons/morning-choice/"]');
    await expect(card).toBeVisible();
    await expect(card).toContainText("Morning Choice");
  });
});
