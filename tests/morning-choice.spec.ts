import { test, expect } from "@playwright/test";

test.describe("Morning Choice lesson", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/lessons/morning-choice/");
    await page.waitForTimeout(1000);
  });

  /** Wait for buttons to appear (narration must finish first) then click */
  async function clickChoice(page: import("@playwright/test").Page, selector: string) {
    // Click the narrative to skip typewriter, then wait for button visibility
    await page.locator(".mc-narrative").click();
    await page.waitForTimeout(200);
    await page.click(selector, { timeout: 5000 });
    // Wait for fade transition
    await page.waitForTimeout(600);
  }

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
    // Skip typewriter to reveal buttons
    await page.locator(".mc-narrative").click();
    await page.waitForTimeout(200);
    const buttons = page.locator(".mc-btn");
    await expect(buttons).toHaveCount(2);
    await expect(buttons.first()).toContainText("5 more minutes");
    await expect(buttons.last()).toContainText("Get up");
  });

  test("stay path progresses through beats", async ({ page }) => {
    await clickChoice(page, ".mc-btn-stay");
    await expect(page.locator(".mc-narrative")).toContainText("alarm again", { ignoreCase: true, timeout: 5000 });

    await clickChoice(page, ".mc-btn-stay");
    await expect(page.locator(".mc-narrative")).toContainText("awake", { timeout: 5000 });

    await clickChoice(page, ".mc-btn-stay");
    await expect(page.locator(".mc-narrative")).toContainText("phone", { timeout: 5000 });

    await clickChoice(page, ".mc-btn-stay");
    await expect(page.locator(".mc-narrative")).toContainText("chair", { timeout: 5000 });
  });

  test("energy bar updates on stay path", async ({ page }) => {
    await expect(page.locator(".mc-energy-label")).toContainText("70");
    await clickChoice(page, ".mc-btn-stay");
    await expect(page.locator(".mc-energy-label")).toContainText("55");
  });

  test("clicking get up shows drag hint", async ({ page }) => {
    // Skip narration, then click get up
    await page.locator(".mc-narrative").click();
    await page.waitForTimeout(200);
    await page.click(".mc-btn-go");
    await page.waitForTimeout(500);
    await expect(page.locator(".mc-drag-hint")).toBeVisible();
    await expect(page.locator(".mc-drag-hint")).toContainText("Drag the raccoon");
  });

  test("retry button restarts the game", async ({ page }) => {
    for (let i = 0; i < 4; i++) {
      await clickChoice(page, ".mc-btn-stay");
    }
    // Wait for easy chair auto-advance to reflection
    await page.waitForTimeout(5000);
    await page.click(".mc-retry", { timeout: 10000 });
    await page.waitForTimeout(1000);
    await expect(page.locator(".mc-narrative")).toContainText("alarm", { ignoreCase: true, timeout: 5000 });
  });

  test("hub page has morning choice card", async ({ page }) => {
    await page.goto("/");
    const card = page.locator('a[href="/lessons/morning-choice/"]');
    await expect(card).toBeVisible();
    await expect(card).toContainText("Morning Choice");
  });
});
